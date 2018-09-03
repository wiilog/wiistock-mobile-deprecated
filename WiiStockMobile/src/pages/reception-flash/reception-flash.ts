import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { ReceptionAddPage } from '../reception-add/reception-add';

/**
 * Generated class for the ReceptionFlashPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reception-flash',
  templateUrl: 'reception-flash.html',
  providers: [[Camera]]
})
export class ReceptionFlashPage {
  private options: CameraOptions;

  constructor(public navCtrl: NavController, public navParams: NavParams, private camera: Camera) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceptionFlashPage');
  }

  takePicture() {
    this.options = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true,
    }

    this.camera.getPicture(this.options).then((imageUri) => {
      console.log(imageUri);
    });

  }

  openPage() {
    this.navCtrl.push(ReceptionAddPage);
  }

}
