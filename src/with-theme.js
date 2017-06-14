import React, {Component} from 'react'

import {CHANNEL} from './constants'
import {PropTypes} from './react-compat'

function generateWarningMessage(componentName) {
  // eslint-disable-next-line max-len
  return `glamorous warning: Expected component called "${componentName}" which uses withTheme to be within a ThemeProvider but none was found.`
}

export default function withTheme(ComponentToTheme, {noWarn = false} = {}) {
  class ThemedComponent extends Component {
    static propTypes = {
      theme: PropTypes.object,
    }
    warned = noWarn
    state = {theme: {}}
    setTheme = theme => this.setState({theme})

    componentWillMount() {
      if (!this.context[CHANNEL]) {
        if (process.env.NODE_ENV !== 'production' && !this.warned) {
          this.warned = true
          // eslint-disable-next-line no-console
          console.warn(
            generateWarningMessage(
              ComponentToTheme.displayName ||
                ComponentToTheme.name ||
                'Stateless Function',
            ),
          )
        }

        return
      }
      const {theme} = this.props
      if (this.context[CHANNEL]) {
        // if a theme is provided via props,
        // it takes precedence over context
        this.setTheme(theme ? theme : this.context[CHANNEL].getState())
      } else {
        this.setTheme(theme || {})
      }
      this.setState({theme: this.context[CHANNEL].getState()})
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.theme !== nextProps.theme) {
        this.setTheme(nextProps.theme)
      }
    }

    componentDidMount() {
      if (this.context[CHANNEL] && !this.props.theme) {
        // subscribe to future theme changes
        this.unsubscribe = this.context[CHANNEL].subscribe(this.setTheme)
      }
    }

    componentWillUnmount() {
      // cleanup subscription
      this.unsubscribe && this.unsubscribe()
    }

    render() {
      return <ComponentToTheme {...this.props} {...this.state} />
    }
  }

  ThemedComponent.contextTypes = {
    [CHANNEL]: PropTypes.object,
  }

  return ThemedComponent
}
