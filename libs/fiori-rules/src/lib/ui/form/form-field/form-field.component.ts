/**
 * @license
 * F. Kolar
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 */
import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {InlineHelpComponent} from '@fundamental-ngx/core';
import {FormFieldControl} from '../form-control';
import {coerceBooleanProperty, coerceNumberProperty} from '@angular/cdk/coercion';
import {FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {startWith, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {defaultLabelForIdentifier} from '@ngx-metaui/rules';

export abstract class FormField {
  i18Strings: TemplateRef<any>;
  editable?: boolean;
  noLabelLayout?: boolean;
  formControl?: FormControl;
}


export type FormZone = 'zTop' | 'zBottom' | 'zLeft' | 'zRight';
export type Column = 1 | 2 | 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Form Field wraps the whole input field
 *
 */
@Component({
  selector: 'fdp-form-field',
  templateUrl: 'form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent implements FormField, AfterContentInit, AfterContentChecked,
  AfterViewInit, OnDestroy, OnInit {

  @Input()
  label: string;

  @Input()
  id: string;

  @Input()
  zone: FormZone;

  @Input()
  hintPlacement: 'left' | 'right' = 'right';

  @Input()
  hint: string;

  @Input()
  noLabelLayout: boolean = false;

  /**
   * By default form field does not render any content as it is wrapped inside ng-template and
   * controlled by parent. This is for cases where FormField is direct child of the form-group.
   *
   * In case we have more nested structure and Form-Field is wrapped with some other element
   * that controls the rendering we need to let go this rendering and render the content
   * directly
   */
  @Input()
  forceRender: boolean = false;

  /**
   * custom width in columns must be between 1 - 12
   */
  @Input()
  get columns(): Column {
    return this._columns;
  }

  set columns(value: Column) {
    this._columns = <Column>coerceNumberProperty(value);
  }

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }


  /**
   * When used as standalone without form-group you can set FormGroup, otherwise it is set from
   * parent
   */
  @Input()
  get formGroup(): FormGroup {
    return this._formGroup;
  }

  set formGroup(value: FormGroup) {
    this._formGroup = value;
    this.initFormControl();
    this._cd.markForCheck();
  }

  @Input()
  validators: Array<ValidatorFn> = [Validators.nullValidator];

  @Input()
  rank: number;

  @Input()
  placeholder: string;

  @Input()
  fluid: boolean = false;

  /**
   * This is in most of the cases set from parent container (form-group)
   */
  @Input()
  i18Strings: TemplateRef<any>;

  @Input()
  get editable(): boolean {
    return this._editable;
  }

  set editable(value: boolean) {
    const newVal = coerceBooleanProperty(value);
    if (this._editable !== newVal) {
      this._editable = value;
      this.updateControlProperties();
    }
  }

  @Output()
  onChange: EventEmitter<string> = new EventEmitter<string>();


  @ViewChild('renderer', {static: true})
  renderer: TemplateRef<any>;

  @ContentChild(InlineHelpComponent)
  _hintChild: InlineHelpComponent;


  @ContentChild(FormFieldControl)
  _control: FormFieldControl<any>;

  protected _editable: boolean = true;
  protected _formGroup: FormGroup;
  protected _required: boolean = false;
  protected _destroyed = new Subject<void>();
  protected _columns: Column = 6;

  formControl: FormControl;


  constructor(private _cd: ChangeDetectorRef) {
    this.formControl = new FormControl();
  }

  ngOnInit(): void {
    if (!this.noLabelLayout && this.id && !this.label) {
      this.label = defaultLabelForIdentifier(this.id);
    }

    if (this.columns && (this.columns < 1 || this.columns > 12)) {
      throw new Error('[columns] accepts numbers between 1 - 12');
    }

    if (this.fluid) {
      this.columns = 12;
    }
  }


  ngAfterContentChecked(): void {
    // this.validateFieldControlComponent();
  }

  ngAfterContentInit(): void {
    // this.validateFieldControlComponent();

    if (this._control && this._control.stateChanges) {
      this._control.stateChanges.pipe(startWith(<string>null!)).subscribe((s) => {
        this.updateControlProperties();
        // need to call explicitly detectChanges() instead of markForCheck before the
        // modified validation state of the control passes over checked phase
        this.onChange.emit('stateChanges');
        this._cd.detectChanges();
      });
    }

    // Refresh UI when value changes
    if (this._control && this._control.ngControl && this._control.ngControl.valueChanges) {
      this._control.ngControl.valueChanges
        .pipe(takeUntil(this._destroyed))
        .subscribe((v) => {
          // this.onChange.emit('valueChangess');
          this._cd.markForCheck();
        });
    }

    if (this.required) {
      this.validators.push(Validators.required);
    }
    this._cd.markForCheck();
  }

  ngAfterViewInit(): void {
    this.validateErrorHandler();
    this.initFormControl();
    this.updateControlProperties();
    this._cd.detectChanges();

  }


  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }


  hasErrors(): boolean {
    return this._editable && this._control && this._control.inErrorState;
  }

  private validateFieldControlComponent() {
    if (!this._control) {
      throw new Error('fdp-form-field must contain component implemented FormFieldControl.');
    }

    if (this._control.ngControl && !this.id) {
      throw new Error('fdp-form-field must contain [id] binding.');
    }
  }


  private validateErrorHandler() {
    if (this._editable && this._control && this.hasValidators() && !this.i18Strings) {
      throw new Error('Validation strings are required for the any provided validations.');
    }
  }

  private hasValidators(): boolean {
    return this.validators && this.validators.length > 1;
  }

  private initFormControl() {
    if (this._control && this._control.ngControl && this._control.ngControl.control) {
      if (this.required) {
        this.validators.push(Validators.required);
      }

      this._control.ngControl.control.setValidators(Validators.compose(this.validators));
      this.formGroup.addControl(this.id, this._control.ngControl.control);
      // this._control.ngControl.control.reset();
    }
  }

  private updateControlProperties() {
    if (this._control && this._editable) {
      this._control.id = this.id;
      this._control.placeholder = this.placeholder;
    }
  }
}

