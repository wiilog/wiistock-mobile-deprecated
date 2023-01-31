import {Component, NgZone, OnInit} from '@angular/core';
import {RfidManagerService} from "../../plugins/rfid-manager/rfid-manager.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements ViewWillEnter, ViewWillLeave {

    public scanStarted: boolean = false;

    public tagReadsCounter: number = 0;

    public constructor(private zebraRfidService: RfidManagerService, private zone: NgZone) {
    }

    public ionViewWillEnter(): void {
        this.zebraRfidService.launchEventListeners();
        this.zebraRfidService.scanStarted$.subscribe(() => {
            console.log("scanStarted$")
            this.zone.run(() => {
                this.scanStarted = true;
            });
        });
        this.zebraRfidService.scanStopped$.subscribe(() => {
            console.log("scanStopped$")
            this.zone.run(() => {
                this.scanStarted = false;
            });
        });
        this.zebraRfidService.tagsRead$.subscribe(({tags}) => {
            tags.forEach((tag) => {
                this.tagReadsCounter++;
                console.log(tag);
            });
        });
    }

    public ionViewWillLeave(): void {
        this.zebraRfidService.removeEventListeners();
    }

    public onScanStartClicked(): void {
        this.zebraRfidService.startScan();
    }

    public onScanStoppedClicked(): void {
        this.zebraRfidService.stopScan();
    }

    public onConnectClicked(): void {
        this.zebraRfidService.connect();
    }

    public onConfigureClicked(): void {
        this.zebraRfidService.configure();
    }

    public onReaderInfo(): void {
        this.zebraRfidService.connectedDeviceInfo();
    }

    public onDisconnectClicked(): void {
        this.zebraRfidService.disconnect();
    }

}
