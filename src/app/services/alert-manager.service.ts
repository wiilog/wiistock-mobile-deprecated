import {Injectable} from "@angular/core";


@Injectable()
export class AlertManagerService {

    public static readonly CSS_CLASS_MANAGED_ALERT = 'custom-managed-alert';

    /**
     * Disable autocapitalize on all input in all alert with CSS_CLASS_MANAGED_ALERT
     */
    public disableAutocapitalizeOnAlert(): void {
        const inputs = document.querySelectorAll(`ion-alert.${AlertManagerService.CSS_CLASS_MANAGED_ALERT} input`);
        inputs.forEach((input: Element) => {
            input.setAttribute('autocapitalize', 'off');
        });
    }
}
