import {Component, EventEmitter, Output} from '@angular/core';
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";

/**
 * Generated class for the FooterPriseDeposeComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'footer-prise-depose',
  templateUrl: 'footer-prise-depose.html'
})
export class FooterPriseDeposeComponent {

  private newArticle: string;
  @Output()
  private addArticle: EventEmitter<[string, boolean]> = new EventEmitter();

  constructor(
      private barcodeScannerManager: BarcodeScannerManagerService,
  ) {
  }

  public scanLocation(): void {
    this.barcodeScannerManager.scan().subscribe((barcode) => {
      this.addArticle.emit([barcode, false]);
    });
  }

  public addManuallyArticle() {
    if (this.newArticle !== '' && this.newArticle !== undefined) this.addArticle.emit([this.newArticle, true]);
  }

}
