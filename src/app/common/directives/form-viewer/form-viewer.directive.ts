import {
    ComponentFactoryResolver,
    Directive,
    Input,
    OnInit, Type,
    ViewContainerRef
} from '@angular/core';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {DetailsViewerParam} from '@app/common/components/panel/model/details-viewer/details-viewer-param';

@Directive({
    selector: '[wiiFormViewer]'
})
export class FormViewerDirective implements OnInit {

    @Input()
    public param: FormViewerParam;

    public instance: DetailsViewerParam;

    public constructor(private componentFactoryResolver: ComponentFactoryResolver,
                       private viewContainerRef: ViewContainerRef) {
    }

    public ngOnInit(): void {
        const {config, item} = this.param;

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(item as Type<DetailsViewerParam>);
        const {instance} = this.viewContainerRef.createComponent<DetailsViewerParam>(componentFactory);

        instance.label = config.label;
        instance.values = config.values;

        this.instance = instance;
    }
}
