import { Component, OnInit } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

@Component({
  selector: 'app-entree-flash',
  templateUrl: './entree-flash.page.html',
  styleUrls: ['./entree-flash.page.scss'],
  providers: [[Camera]]
})
export class EntreeFlashPage implements OnInit {

  private options: CameraOptions;
  constructor(private camera: Camera) { }

  ngOnInit() {
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

}
