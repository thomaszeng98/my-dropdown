import { Component, State, h, Listen, Element, Prop, Watch } from '@stencil/core';

export interface SelectedOption {
  value: string;
  label: string;
}

@Component({
  tag: 'my-dropdown',
  styleUrl: 'my-dropdown.css',
  shadow: true,
})
export class MyDropdown {
  @Element() host!: HTMLElement;
  
  @Prop() placeholder: string = 'Search...';
  
  @State() isOpen = false;
  @State() selectedOptions: SelectedOption[] = [];
  @State() searchTerm = '';
  @State() focusedIndex = -1;

  private inputRef?: HTMLInputElement;

  componentWillLoad() {
    // Initialize default selections before first render to avoid extra re-renders
    this.initializeDefaultSelections();
  }

  private initializeDefaultSelections() {
    const options = this.getOptionElements();
    const defaultSelected: SelectedOption[] = [];

    options.forEach((option) => {
      if (option.hasAttribute('selected')) {
        const value = option.getAttribute('value') || '';
        const label = option.getAttribute('label') || option.textContent?.trim() || '';
        defaultSelected.push({ value, label });
        (option as any).isSelected = true;
      }
    });

    if (defaultSelected.length > 0) {
      this.selectedOptions = defaultSelected;
    }
  }

  private getOptionElements(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll('my-dropdown-option'));
  }

  private getVisibleOptionElements(): HTMLElement[] {
    return this.getOptionElements().filter(
      (opt) => opt.style.display !== 'none'
    );
  }

  private async selectFocusedOption(visibleOptions: HTMLElement[]) {
    if (this.focusedIndex >= 0 && this.focusedIndex < visibleOptions.length) {
      const option = visibleOptions[this.focusedIndex] as any;
      if (option.select) {
        await option.select();
      }
    }
  }

  private handleKeyDown = async (event: KeyboardEvent) => {
    const visibleOptions = this.getVisibleOptionElements();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.isOpen = false;
        this.focusedIndex = -1;
        break;

      case 'Enter':
        event.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          this.focusedIndex = 0;
          this.updateFocusedOption(this.getVisibleOptionElements());
        } else {
          await this.selectFocusedOption(visibleOptions);
        }
        break;

      case ' ':
        if (this.isOpen && this.focusedIndex >= 0) {
          event.preventDefault();
          await this.selectFocusedOption(visibleOptions);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          this.focusedIndex = 0;
        } else {
          if (this.focusedIndex < 0) {
            this.focusedIndex = 0;
          } else {
            this.focusedIndex = Math.min(this.focusedIndex + 1, visibleOptions.length - 1);
          }
        }
        this.updateFocusedOption(visibleOptions);
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen) {
          if (this.focusedIndex < 0) {
            this.focusedIndex = visibleOptions.length - 1;
          } else {
            this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
          }
          this.updateFocusedOption(visibleOptions);
        }
        break;
    }
  };

  private updateFocusedOption(visibleOptions: HTMLElement[]) {
    this.getOptionElements().forEach((opt) => {
      (opt as any).isFocused = false;
    });

    if (this.focusedIndex >= 0 && this.focusedIndex < visibleOptions.length) {
      (visibleOptions[this.focusedIndex] as any).isFocused = true;
      visibleOptions[this.focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  @Watch('isOpen')
  onOpenChange(newValue: boolean) {
    if (!newValue) {
      this.focusedIndex = -1;
      this.getOptionElements().forEach((opt) => {
        (opt as any).isFocused = false;
      });
    }
  }

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    const path = event.composedPath();
    const clickedInside = path.includes(this.host);

    if (!clickedInside) {
      this.isOpen = false;
    }
  }

  private setOptionSelected(value: string, isSelected: boolean) {
    const optionEl = this.host.querySelector(
      `my-dropdown-option[value="${CSS.escape(value)}"]`
    ) as any | null;
    if (optionEl) {
      optionEl.isSelected = isSelected;
    }
  }

  @Listen('optionSelectedToggle')
  handleOptionSelected(event: CustomEvent<{ value: string; label: string }>) {
    const { value, label } = event.detail;
    const exists = this.selectedOptions.some((option) => option.value === value);

    let next: SelectedOption[];

    if (exists) {
      next = this.selectedOptions.filter((option) => option.value !== value);
      this.setOptionSelected(value, false);
    } else {
      next = [...this.selectedOptions, { value, label }];
      this.setOptionSelected(value, true);
    }

    this.selectedOptions = next;

    const visibleOptions = this.getVisibleOptionElements();
    const clickedIndex = visibleOptions.findIndex(
      (opt) => opt.getAttribute('value') === value
    );
    if (clickedIndex >= 0) {
      this.focusedIndex = clickedIndex;
      this.updateFocusedOption(visibleOptions);
    }

    this.inputRef?.focus();
  }

  private handleOptionRemoved = (value: string) => {
    this.selectedOptions = this.selectedOptions.filter((option) => option.value !== value);
    this.setOptionSelected(value, false);
    this.inputRef?.focus();
  };

  private handleInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterOptions();
    this.focusedIndex = -1;
  };

  private filterOptions() {
    const term = this.searchTerm.trim().toLowerCase();

    const options = this.getOptionElements();

    options.forEach((option) => {
      const label = (option.getAttribute('label') || option.textContent || '').toLowerCase();
      const value = (option.getAttribute('value') || '').toLowerCase();

      const matches = term === '' || label.includes(term) || value.includes(term);

      option.style.display = matches ? '' : 'none';
    });
  }

  private handleInputWrapperClick = () => {
    this.inputRef?.focus();
    this.isOpen = true;
  };

  render() {
    return (
      <div class="my-select" part="container">
        <div
          class="input-wrapper"
          part="input-wrapper"
          onClick={this.handleInputWrapperClick}
        >
          {this.selectedOptions.map((option) => (
            <span class="selected-option-chip" part="chip" key={option.value}>
              {option.label}
              <button
                type="button"
                class="remove-button"
                part="chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  this.handleOptionRemoved(option.value);
                }}
                aria-label={`Remove ${option.label}`}
              >
                <span class="remove-button-icon" aria-hidden="true">×</span>
              </button>
            </span>
          ))}
          <input
            type="text"
            part="input"
            placeholder={this.selectedOptions.length === 0 ? this.placeholder : ''}
            onFocus={() => (this.isOpen = true)}
            onKeyDown={this.handleKeyDown}
            value={this.searchTerm}
            onInput={this.handleInputChange}
            ref={(el) => (this.inputRef = el)}
            role="combobox"
            aria-expanded={this.isOpen ? 'true' : 'false'}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
        </div>
        <div
          class="my-dropdown"
          part="dropdown"
          role="listbox"
          aria-multiselectable="true"
          style={{ display: this.isOpen ? 'block' : 'none' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <slot></slot>
        </div>
      </div>
    );
  }
}
