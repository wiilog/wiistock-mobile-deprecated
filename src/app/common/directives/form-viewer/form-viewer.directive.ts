import {
    ComponentFactoryResolver,
    Directive,
    Input,
    OnInit, Type,
    ViewContainerRef
} from '@angular/core';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {FormViewerDetailsConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-details-config';

@Directive({
    selector: '[wiiFormViewer]'
})
export class FormViewerDirective implements OnInit {

    @Input()
    public param: FormViewerParam;

    public instance: FormViewerDetailsConfig;

    public constructor(private componentFactoryResolver: ComponentFactoryResolver,
                       private viewContainerRef: ViewContainerRef) {
    }

    public ngOnInit(): void {
        const {config, item} = this.param;

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(item as Type<FormViewerDetailsConfig>);
        const {instance} = this.viewContainerRef.createComponent<FormViewerDetailsConfig>(componentFactory);

        instance.label = config.label;
        instance.value = config.value;

        this.instance = instance;
    }
}
