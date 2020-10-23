import {
    ComponentFactoryResolver,
    Directive,
    Input,
    OnInit, Type,
    ViewContainerRef
} from '@angular/core';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item.component';

@Directive({
    selector: '[wiiFormPanel]'
})
export class FormPanelDirective implements OnInit {

    @Input()
    public param: FormPanelParam;

    public instance: FormPanelItemComponent<any>;

    public constructor(private componentFactoryResolver: ComponentFactoryResolver,
                       private viewContainerRef: ViewContainerRef) {
    }

    public ngOnInit(): void {
        const {config, item} = this.param;

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(item as Type<FormPanelItemComponent<any>>);
        const {instance} = this.viewContainerRef.createComponent<FormPanelItemComponent<any>>(componentFactory);

        instance.inputConfig = config.inputConfig;
        instance.value = config.value;
        instance.label = config.label;
        instance.name = config.name;
        instance.errors = config.errors;
        instance.group = config.group;

        this.instance = instance;
    }
}
