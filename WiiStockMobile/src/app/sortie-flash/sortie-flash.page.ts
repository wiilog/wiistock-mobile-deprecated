import { Component, OnInit } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

@Component({
  selector: 'app-sortie-flash',
  templateUrl: './sortie-flash.page.html',
  styleUrls: ['./sortie-flash.page.scss'],
  providers: [[Camera]]
})
export class SortieFlashPage implements OnInit {

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
