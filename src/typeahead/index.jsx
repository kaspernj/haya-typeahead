import "./style"
import classNames from "classnames"
import debounce from "debounce"
import {digs} from "diggerize"
import EventListener from "@kaspernj/api-maker/src/event-listener"

export default class HayaTypeahead extends React.PureComponent {
  static propTypes = PropTypesExact({
    className: PropTypes.string,
    inputProps: PropTypes.object,
    onOptionChosen: PropTypes.func,
    optionsCallback: PropTypes.func
  })

  inputRef = React.createRef()
  rootRef = React.createRef()

  state = {
    options: [],
    optionsOpen: false,
    selectionIndex: null,
    selectedOption: null
  }

  render() {
    const {inputRef, onChange, onFocus, onKeyDown, rootRef} = digs(this, "inputRef", "onChange", "onFocus", "onKeyDown", "rootRef")
    const {className, inputProps} = this.props
    const {options, optionsOpen, selectionIndex} = digs(this.state, "options", "optionsOpen", "selectionIndex")

    return (
      <div className={classNames("haya--typeahead", className)} ref={rootRef}>
        <EventListener event="click" onCalled={this.onWindowClicked} target={window} />
        <input
          {...inputProps}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          ref={inputRef}
        />
        {optionsOpen && options.length > 0 &&
          <div className="haya--typeahead--options-container">
            {options.map(({text, value}, optionIndex) =>
              <a
                className="haya--typeahead-option-link"
                data-focus={optionIndex == selectionIndex}
                data-value={value}
                href="#"
                key={value}
                onClick={(e) => this.onOptionLinkClicked(e, {optionIndex})}
              >
                {text}
              </a>
            )}
          </div>
        }
      </div>
    )
  }

  applySelection = (selectionIndex) => {
    const {onOptionChosen} = this.props
    const input = digg(this, "inputRef", "current")
    const {options, selectedOption} = digs(this.state, "options", "selectedOption")
    const option = digg(options, selectionIndex)

    input.value = option.text

    if (!selectedOption || selectedOption.value != option.value) {
      if (onOptionChosen) onOptionChosen({option})

      this.setState({
        optionsOpen: false,
        selectedOption: option
      })
    }
  }

  onChange = async (e) => {
    const value = e.target.value

    this.loadNewOptionsDebounced({value})
  }

  loadNewOptions = async ({value}) => {
    const {optionsCallback} = digs(this.props, "optionsCallback")
    const {selectionIndex} = digs(this.state, "selectionIndex")
    const options = await optionsCallback({searchValue: value})
    const newState = {options}

    if (selectionIndex !== null && selectionIndex >= options.length) newState.selectionIndex = options.length - 1

    this.findSelectedFromMatchingOption({options, value})

    this.setState(newState)
  }

  findSelectedFromMatchingOption = ({options, value}) => {
    const {onOptionChosen} = this.props
    const matchingOption = options.find((option) => option.text.trim().toLowerCase() == value.trim().toLowerCase())

    if (matchingOption) {
      if (onOptionChosen) onOptionChosen({option: matchingOption})
      this.setState({
        selectedOption: matchingOption
      })
    }
  }

  loadNewOptionsDebounced = debounce(digg(this, "loadNewOptions"), 250)
  onFocus = () => this.setState({optionsOpen: true})

  onKeyDown = (e) => {
    const {optionsOpen, selectionIndex} = digs(this.state, "optionsOpen", "selectionIndex")
    const enterPressed = (e.code == "Enter" || e.keyCode == 13)
    const leftAltPressed = (e.code == "AltLeft" || e.keyCode == 18)

    if (e.code == "ArrowDown" || e.keyCode == 40) {
      e.preventDefault()
      this.moveSelectionDown()
    } else if (e.code == "ArrowUp" || e.keyCode == 38){
      e.preventDefault()
      this.moveSelectionUp()
    } else if (enterPressed && selectionIndex !== null) {
      e.preventDefault()
      this.applySelection(selectionIndex)
    } else if (e.code == "Escape" || e.keyCode == 27){
      this.setState({optionsOpen: false})
    }

    if (!optionsOpen && !enterPressed && !leftAltPressed) this.setState({optionsOpen: true})
  }

  onOptionLinkClicked = (e, {optionIndex}) => {
    e.preventDefault()

    this.applySelection(optionIndex)
  }

  onWindowClicked = (e) => {
    const {rootRef} = digs(this, "rootRef")
    const {optionsOpen} = digs(this.state, "optionsOpen")

    // If options are open and a click is made outside of the options container
    if (optionsOpen && rootRef.current && !rootRef.current.contains(e.target)) {
      console.log("clicked outside - close")
      this.setState({optionsOpen: false})
    }
  }

  moveSelectionUp = () => {
    const {options, selectionIndex} = digs(this.state, "options", "selectionIndex")

    if (selectionIndex === null) {
      this.setState({selectionIndex: options.length - 1})
    } else if (selectionIndex === 0) {
      this.setState({selectionIndex: null})
    } else {
      this.setState(prevState => ({selectionIndex: prevState.selectionIndex - 1}))
    }
  }

  moveSelectionDown = () => {
    const {options, selectionIndex} = digs(this.state, "options", "selectionIndex")

    if (selectionIndex === null) {
      this.setState({selectionIndex: 0})
    } else if (selectionIndex === options.length - 1) {
      this.setState({selectionIndex: null})
    } else {
      this.setState(prevState => ({selectionIndex: prevState.selectionIndex + 1}))
    }
  }
}
