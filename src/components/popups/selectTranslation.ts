import PopupElement from './index';
import {attachClickEvent} from '../../helpers/dom/clickEvent';
import {toastNew} from '../toast';
import InputField from '../inputField';
import TelInputField from '../telInputField';
import {formatPhoneNumber} from '../../helpers/formatPhoneNumber';
import EditPeer from '../editPeer';

export default class PopupSelectTranslationLanguage extends PopupElement{

  constructor() {
    super('popup-create-contact popup-send-photo popup-new-media', {closable: true, withConfirm: 'Save', title: 'SelectTrans'});
    this.construct();
  }

  private async construct() {
    attachClickEvent(this.btnConfirm, () => {
      // const promise = this.managers.appUsersManager.importContact(nameInputField.value, lastNameInputField.value, telInputField.value);
      //
      // promise.then(() => {
      //   this.hide();
      // }, (err) => {
      //   if(err.type === 'NO_USER') {
      //     toastNew({langPackKey: 'Contacts.PhoneNumber.NotRegistred'});
      //     editPeer.disabled = false;
      //   }
      // });
      //
      // editPeer.lockWithPromise(promise);
    }, {listenerSetter: this.listenerSetter});
    const inputFields: InputField[] = [];
    const div = document.createElement('div');
    div.classList.add('name-fields');
    const nameInputField = new InputField({
      label: 'FirstName',
      name: 'create-contact-name',
      maxLength: 70,
      required: true
    });
    const lastNameInputField = new InputField({
      label: 'LastName',
      name: 'create-contact-lastname',
      maxLength: 70
    });
    const telInputField = new TelInputField({required: true});
    inputFields.push(nameInputField, lastNameInputField, telInputField);

    const onInput = () => {
      const name = nameInputField.value + ' ' + lastNameInputField.value;
      // const abbr = getAbbreviation(name);
      editPeer.avatarElem.peerTitle = name;
      editPeer.avatarElem.update();
    };

    this.listenerSetter.add(nameInputField.input)('input', onInput);
    this.listenerSetter.add(lastNameInputField.input)('input', onInput);

    telInputField.validate = () => {
      return !!telInputField.value.match(/\d/);
    };

    const user = await this.managers.appUsersManager.getSelf();
    const formatted = formatPhoneNumber(user.phone);
    if(formatted.code) {
      telInputField.value = '+' + formatted.code.country_code;
    }

    const editPeer = new EditPeer({
      inputFields,
      listenerSetter: this.listenerSetter,
      doNotEditAvatar: true,
      nextBtn: this.btnConfirm,
      avatarSize: 100
    });

    div.append(nameInputField.container, lastNameInputField.container, editPeer.avatarElem);
    this.container.append(div, telInputField.container);

    this.show();
  }
}
