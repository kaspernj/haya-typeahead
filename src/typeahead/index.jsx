import {Platform, Pressable, Text, TextInput, View} from "react-native"
import {shapeComponent, ShapeComponent} from "set-state-compare/src/shape-component"
import classNames from "classnames"
import debounce from "debounce"
import {digs} from "diggerize"
import useEventListener from "@kaspernj/api-maker/src/use-event-listener"
import PropTypesExact from "prop-types-exact"

const Option = shapeComponent(class Option extends ShapeComponent {
  render() {
    const {optionIndex, optionStyle, optionActiveStyle, selectionIndex, text, value} = this.props
    const focus = optionIndex == selectionIndex
    let style = {}

    if (focus) {
      style.backgroundColor = "blue"
    }

    if (optionStyle) style = Object.assign(style, optionStyle)
    if (focus && optionActiveStyle) style = Object.assign(style, optionActiveStyle)

    return (
      <Pressable
        dataSet={{class: "haya--typeahead-option-link", focus, value}}
        onPress={this.onOptionLinkClicked}
        style={style}
      >
        <Text>
          {text}
        </Text>
      </Pressable>
    )
  }

  onOptionLinkClicked = () => {
    this.props.onOptionLinkClicked({optionIndex: this.props.optionIndex})
  }
})

export default shapeComponent(class HayaTypeahead extends ShapeComponent {
  static propTypes = PropTypesExact({
    className: PropTypes.string,
    inputComponent: PropTypes.elementType,
    inputProps: PropTypes.object,
    onChangeText: PropTypes.func,
    onOptionChosen: PropTypes.func,
    optionsCallback: PropTypes.func,
    optionsContainerStyle: PropTypes.object,
    optionStyle: PropTypes.object,
    optionActiveStyle: PropTypes.object,
    style: PropTypes.object,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })

  setup() {
    this.rootRef = useRef()

    this.useStates({
      options: [],
      optionsOpen: false,
      selectionIndex: null,
      selectedOption: null
    })
  }

  render() {
    const {onChangeText, onFocus, onKeyDown, rootRef} = digs(this, "onChangeText", "onFocus", "onKeyDown", "rootRef")
    const {className, inputComponent, inputProps, optionsContainerStyle, optionStyle, optionActiveStyle, style, value} = this.props
    const {options, optionsOpen, selectionIndex} = digs(this.state, "options", "optionsOpen", "selectionIndex")
    const actualInputProps = {...inputProps, onChangeText, onFocus, onKeyPress: onKeyDown, value}

    if (Platform.OS == "web") {
      useEventListener(window, "click", this.onWindowClicked)
    }

    const actualOptionsContainerStyle = Object.assign(
      {
        position: "absolute",
        top: 1,
        left: 1,
        zIndex: 9999,
        elevation: 9999,
        width: "100%",
        border: "1px solid black",
        background: "#fff"
      },
      optionsContainerStyle
    )

    return (
      <View dataSet={{class: classNames("haya--typeahead", className)}} ref={rootRef} style={style}>
        {inputComponent && inputComponent({inputProps: actualInputProps})}
        {!inputComponent && <TextInput {...actualInputProps} />}
        {optionsOpen && options.length > 0 &&
          <View>
            <View dataSet={{class: "haya--typeahead--options-container"}} style={actualOptionsContainerStyle}>
              {options.map(({text, value}, optionIndex) =>
                <Option
                  key={value}
                  onOptionLinkClicked={this.onOptionLinkClicked}
                  optionActiveStyle={optionActiveStyle}
                  optionIndex={optionIndex}
                  optionStyle={optionStyle}
                  selectionIndex={selectionIndex}
                  text={text}
                  value={value}
                />
              )}
            </View>
          </View>
        }
      </View>
    )
  }

  applySelection = (selectionIndex) => {
    const {onOptionChosen} = this.props
    const {options, selectedOption} = digs(this.state, "options", "selectedOption")
    const option = digg(options, selectionIndex)

    if (!selectedOption || selectedOption.value != option.value) {
      if (onOptionChosen) onOptionChosen({option})

      this.setState({
        optionsOpen: false,
        selectedOption: option
      })
    }
  }

  onChangeText = async (value) => {
    this.loadNewOptionsDebounced({value})

    if (this.props.onChangeText) this.props.onChangeText(value)
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

  onOptionLinkClicked = ({optionIndex}) => {
    this.applySelection(optionIndex)
  }

  onWindowClicked = (e) => {
    const {rootRef} = digs(this, "rootRef")
    const {optionsOpen} = digs(this.state, "optionsOpen")

    // If options are open and a click is made outside of the options container
    if (optionsOpen && rootRef.current && !rootRef.current.contains(e.target)) {
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
})
