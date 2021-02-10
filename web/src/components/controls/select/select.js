
import React from "react";
import ReactDOM from 'react-dom';
import "./select.css";

export class Select extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            optionsVisible: false
        }    
        
        this.domNode = document.body;
        this.element = React.createRef();
    }

    addEvents = () => {
        window.addEventListener("click", this.handleOuterClick);
    }

    removeEvents = () => {
        window.removeEventListener("click", this.handleOuterClick);
    }

    handleOuterClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setVisibility(false);
    }

    handleSelect = (value) => {
        // hide options
        this.setVisibility(false);

        if (value === this.props.value) {
            return;
        }

        // cutted event, for backward compatibility
        let event = {
            target:{
                name: this.props.name,
                value: value
            }
        }
        // callback
        this.props.onChange && this.props.onChange(event);
    }

    handleInputClick = (e) => {
        e.preventDefault();
        //e.stopPropagation();
        let newState = !this.state.optionsVisible;
        setTimeout(() => {this.setVisibility(newState)}, 0);
    }

    setVisibility = (value) => {
        this.setState({
            optionsVisible: value
        });
        
        if (value === true) {
            this.addEvents();
        } else {
            this.removeEvents();
        }
    }


    renderOptions() {
        const childrenWithProps = React.Children.map(this.props.children, child => {
            // checking isValidElement is the safe way and avoids a typescript error too
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { onSelect: this.handleSelect });
            }
            return child;
          });
        return childrenWithProps;
    }

    renderInput() {
        if (this.props.input && React.isValidElement(this.props.input)) {
            return React.cloneElement(this.props.input, { onClick: this.handleInputClick});
        } else {
            return <div className="app-select__input" onClick={this.handleInputClick}>{this.displayValue}</div>
        }
    }

    get displayValue () {
        let option = null;
        if (Array.isArray(this.props.children)) {
            option = this.props.children.find(x => x.props.value === this.props.value);
        } else {
            option = this.props.children
        }
        let optionContent = option === undefined ? this.props.value : option.props.content;
        return optionContent;
    }

    get positionStyle() {
        if (!this.element.current) {
            return {};
        }
        let bound = this.element.current.getBoundingClientRect();
        return {
            top: bound.top + bound.height + "px",
            left: bound.left + "px",
        }
    }

    render() {
        return <div ref={this.element} className={"app-select "  + (this.state.optionsVisible ? " app-select--custom-input" : " app-select--custom-input")}>
            {this.renderInput()}
            {
                ReactDOM.createPortal(
                    <div style={{...this.positionStyle}} className={"app-select__options " + (this.state.optionsVisible ? "app-select__options--visible" : "app-select__options--hidden")}>
                        {this.renderOptions()}
                    </div>, 
                    this.domNode)
            }
            
        </div>
    }
}

// export class OptionsList extends React.Component {

//     render() {
//         return ReactDOM.createPortal(
//             this.props.children,
//             domNode
//           );
//     }
// }

export class Option extends React.PureComponent {
    handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.onSelect && this.props.onSelect(this.props.value);
        this.props.onClick && this.props.onClick();
    }

    render() {
        return <div className="app-select-option" onClick={this.handleClick} style={{...this.props.style}}>{this.props.content}</div>;
    }
}