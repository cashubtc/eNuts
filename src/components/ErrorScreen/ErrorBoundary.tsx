import { isReactNativeDevMode } from '@consts'
import { err } from '@log'
import { reportCrash } from '@util/crashReporting'
import { Component, ErrorInfo, ReactNode } from 'react'

import { ErrorDetails } from './ErrorDetails'

interface IProps {
	children: ReactNode
	catchErrors: 'always' | 'dev' | 'prod' | 'never'
	fallbackComponent?: (() => JSX.Element)
}

interface IState {
	error: Error | null
	errorInfo: ErrorInfo | null
}

/**
 * This component handles whenever the user encounters a JS error in the
 * app. It follows the "error boundary" pattern in React. We're using a
 * class component because according to the documentation, only class
 * components can be error boundaries.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Error-Boundary.md)
 * - [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
 */
export class CustomErrorBoundary extends Component<IProps, IState> {
	state = { error: null, errorInfo: null }

	// If an error in a child is encountered, this will run
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Catch errors in any components below and re-render with error message
		this.setState({ error, errorInfo, })
		reportCrash(error, errorInfo)
		err(error, errorInfo)
	}

	// Reset the error back to null
	resetError = () => {
		this.setState({ error: null, errorInfo: null })
	}

	// To avoid unnecessary re-renders
	shouldComponentUpdate(_nextProps: Readonly<IProps>, nextState: Readonly<IState>): boolean {
		return nextState.error !== this.state.error
	}

	// Only enable if we're catching errors in the right environment
	// TODO use fallbackComponent !
	isEnabled(): boolean {
		return (
			this.props.catchErrors === 'always' ||
			(this.props.catchErrors === 'dev' && isReactNativeDevMode) ||
			(this.props.catchErrors === 'prod' && !isReactNativeDevMode)
		)
	}

	// Render an error UI if there's an error; otherwise, render children
	render() {
		return this.isEnabled() && this.state.error ?
			<ErrorDetails
				onReset={this.resetError}
				error={this.state.error}
				errorInfo={this.state.errorInfo}
			/>
			:
			this.props.children
	}
}
