import { Component, Prop, h, Event, EventEmitter, Element, Method, Watch, forceUpdate } from '@stencil/core';

@Component({
  tag: 'my-dropdown-option',
  styleUrl: 'my-dropdown-option.css',
  shadow: true,
})
export class MyDropdownOption {
  @Element() host!: HTMLElement;

  @Prop({ reflect: true }) value!: string;
  @Prop() label?: string;
  @Prop({ mutable: true, reflect: true }) isSelected: boolean = false;
  @Prop({ mutable: true, reflect: true }) isFocused: boolean = false;

  @Watch('isFocused')
  @Watch('isSelected')
  onPropChange() {
    forceUpdate(this);
  }

  @Event({ bubbles: true, composed: true })
  optionSelectedToggle: EventEmitter<{ value: string; label: string }>;

  private getLabel(): string {
    if (this.label && this.label.trim() !== '') {
      return this.label;
    }
    const text = this.host.textContent || '';
    return text.trim();
  }

  @Method()
  async select() {
    this.optionSelectedToggle.emit({ value: this.value, label: this.getLabel() });
  }

  private handleClick = () => {
    this.optionSelectedToggle.emit({ value: this.value, label: this.getLabel() });
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }
  };

  render() {
    const classes = {
      option: true,
      selected: this.isSelected,
      focused: this.isFocused,
    };

    return (
      <div
        class={classes}
        part="option"
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        role="option"
        aria-selected={this.isSelected ? 'true' : 'false'}
      >
        <span class="checkbox" part="checkbox" aria-hidden="true">
          {this.isSelected ? '✓' : ''}
        </span>
        <span class="label" part="label">
          {this.label || <slot />}
        </span>
      </div>
    );
  }
}
