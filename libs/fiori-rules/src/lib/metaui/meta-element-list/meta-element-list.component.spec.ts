/**
 * @license
 * Copyright 2017 SAP Ariba
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
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {APP_BASE_HREF} from '@angular/common';
import {Entity, META_RULES, MetaRules, MetaUITestRulesModule} from '@ngx-metaui/rules';
import {FioriRulesModule} from '../../fiori-rules.module.js';


describe('How  Stack layout can render two different content stacked',
  () => {

    beforeEach((done) => {
      TestBed.configureTestingModule({
        declarations: [
          TestContainerEditComponent
        ],
        imports: [
          MetaUITestRulesModule.forRoot({'env.test': true}),
          FioriRulesModule.forRoot()
        ],
        providers: [{provide: APP_BASE_HREF, useValue: '/'}]
      });

      TestBed.compileComponents();

      window.setTimeout(function () {
        done();
      }, 0);
    });


    it('should render two FormTables', () => {

      const metaUI: MetaRules = TestBed.inject(META_RULES);
      metaUI.addTestUserRule('UserStackRule', UserStackRule);

      const fixtureWrapper = TestBed.createComponent(TestContainerEditComponent);

      fixtureWrapper.detectChanges();

      fixtureWrapper.detectChanges();

      const formTables = fixtureWrapper.nativeElement.querySelectorAll('fdp-form-group');

      fixtureWrapper.detectChanges();
      expect(formTables).toBeDefined();
      expect(formTables.length).toEqual(2);
      expect(formTables[0].querySelectorAll(('.fd-form-item input')).length).toEqual(4);
      expect(formTables[1].querySelectorAll(('.fd-form-item input')).length).toEqual(1);
    });


  });


class UserStack implements Entity {
  constructor(public firstName: string, public lastName: string,
              public age: number, public department: string,
              public email: string) {
  }


  identity(): string {
    return this.lastName;
  }

  className(): string {
    return 'UserStack';
  }

  getTypes(): any {
    return {
      firstName: String,
      lastName: String,
      age: Number,
      department: String,
      email: String
    };
  }
}


@Component({
  selector: 'fdp-wrapper-comp',
  template: '<m-context [object]="user" operation="edit" layout="InspectTest2">' +
    '<m-include-component >' +
    '</m-include-component></m-context>'
})
class TestContainerEditComponent {
  user: UserStack = new UserStack('Frank', 'Kolar', 1000, 'aa.',
    'fkolar@gmail.com');
}


// @formatter:off
/* tslint:disable */
export const UserStackRule =
  'layout=InspectTest2#Stack {' +
  '       @layout=First#Form {' +
  '       }' +
  '       @layout=Second#Form { zonePath:Second; }' +
  '   }' +
  '' +
  '' +
  '    class=UserStack {' +
  '       zNone => *;' +
  '       zLeft => firstName => lastName => age => department;' +
  '       Second.zLeft => email;' +

  '   }';
// @formatter:on
/* tslint:disable */
