import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { TransfertAddPage } from '../transfert-add/transfert-add';

/**
 * Generated class for the TransfertFlashPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-transfert-flash',
  templateUrl: 'transfert-flash.html',
  providers: [[Camera]]
})
export class TransfertFlashPage {
  private options: CameraOptions;

  constructor(public navCtrl: NavController, public navParams: NavParams, private camera: Camera) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransfertFlashPage');
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
    this.navCtrl.push(TransfertAddPage);
  }
  
}
