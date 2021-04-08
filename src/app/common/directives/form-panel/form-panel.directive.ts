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
        const {item} = this.param;

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(item as Type<FormPanelItemComponent<any>>);
        const {instance} = this.viewContainerRef.createComponent<FormPanelItemComponent<any>>(componentFactory);
        this.instance = instance;

        this.reloadInstance();
    }

    public reloadInstance(): void {
        const {config} = this.param;

        this.instance.inputConfig = config.inputConfig;
        this.instance.value = config.value;
        this.instance.label = config.label;
        this.instance.name = config.name;
        this.instance.errors = config.errors;
        this.instance.group = config.group;
        console.log(this.instance.inputConfig)
    }
}
