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
    focus: false,
    options: [],
    selectionIndex: null
  }

  render() {
    const {inputRef, onBlur, onChangeDebounced, onFocus, onKeyPress} = digs(this, "inputRef", "onBlur", "onChangeDebounced", "onFocus", "onKeyPress")
    const {className, inputProps} = this.props
    const {focus, options, selectionIndex} = digs(this.state, "focus", "options", "selectionIndex")

    return (
      <div className={classNames("haya--typeahead", className)}>
        <input
          {...inputProps}
          onBlur={onBlur}
          onChange={onChangeDebounced}
          onFocus={onFocus}
          onKeyDown={onKeyPress}
          ref={inputRef}
        />
        {focus &&
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
  }

  onBlur = () => setTimeout(() => this.setState({focus: false}), 10)

  onChange = async (e) => {
    const {optionsCallback} = digs(this.props, "optionsCallback")
    const options = await optionsCallback({searchValue: e.target.value})

    this.setState({options})
  }

  onChangeDebounced = debounce(digg(this, "onChange"), 250)

  onFocus = () => this.setState({focus: true})

  onKeyPress = (e) => {
    if (e.code == "ArrowDown" || e.keyCode == 40) {
      e.preventDefault()
      this.moveSelectionDown()
    } else if (e.code == "ArrowUp" || e.keyCode == 38){
      e.preventDefault()
      this.moveSelectionUp()
    } else if ((e.code == "Enter" || e.keyCode == 13) && this.state.selectionIndex !== null) {
      e.preventDefault()
      this.applySelection()
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
