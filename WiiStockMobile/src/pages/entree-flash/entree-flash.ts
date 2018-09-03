import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { EntreeAddPage } from '../entree-add/entree-add';

/**
 * Generated class for the EntreeFlashPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-entree-flash',
  templateUrl: 'entree-flash.html',
  providers: [[Camera]]
})
export class EntreeFlashPage {
  private options: CameraOptions;

  constructor(public navCtrl: NavController, public navParams: NavParams, private camera: Camera) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EntreeFlashPage');
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
    this.navCtrl.push(EntreeAddPage);
  }

}
