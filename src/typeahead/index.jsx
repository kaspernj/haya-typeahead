import "./style"
import classNames from "classnames"
import debounce from "debounce"
import {digs} from "diggerize"

export default class HayaTypeahead extends React.PureComponent {
  static propTypes = PropTypesExact({
    className: PropTypes.string,
    inputProps: PropTypes.object,
    optionsCallback: PropTypes.func
  })

  inputRef = React.createRef()

  state = {
    options: [],
    optionsOpen: false,
    selectionIndex: null
  }

  render() {
    const {inputRef, onBlur, onChangeDebounced, onFocus, onKeyDown} = digs(this, "inputRef", "onBlur", "onChangeDebounced", "onFocus", "onKeyDown")
    const {className, inputProps} = this.props
    const {options, optionsOpen, selectionIndex} = digs(this.state, "options", "optionsOpen", "selectionIndex")

    return (
      <div className={classNames("haya--typeahead", className)}>
        <input
          {...inputProps}
          onBlur={onBlur}
          onChange={onChangeDebounced}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          ref={inputRef}
        />
        {optionsOpen && options.length > 0 &&
          <div className="haya--typeahead--options-container">
            {options.map(({text, value}, optionIndex) =>
              <div className="haya--typeahead-option-container" data-focus={optionIndex == selectionIndex} key={value}>
                {text}
              </div>
            )}
          </div>
        }
      </div>
    )
  }

  applySelection = () => {
    const input = digg(this, "inputRef", "current")
    const {options, selectionIndex} = digs(this.state, "options", "selectionIndex")
    const option = digg(options, selectionIndex)

    input.value = option.text

    this.setState({optionsOpen: false})
  }

  onBlur = () => setTimeout(() => this.setState({optionsOpen: false}), 10)

  onChange = async (e) => {
    const {optionsCallback} = digs(this.props, "optionsCallback")
    const {selectionIndex} = digs(this.state, "selectionIndex")
    const options = await optionsCallback({searchValue: e.target.value})
    const newState = {options}

    if (selectionIndex !== null && selectionIndex >= options.length) newState.selectionIndex = options.length - 1

    this.setState(newState)
  }

  onChangeDebounced = debounce(digg(this, "onChange"), 250)

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
      this.applySelection()
    }

    if (!optionsOpen && !enterPressed && !leftAltPressed) this.setState({optionsOpen: true})
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
