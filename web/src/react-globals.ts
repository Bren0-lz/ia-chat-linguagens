import React from 'react'
import * as ReactDOMClient from 'react-dom/client'

;(window as unknown as { React: typeof React }).React = React
;(window as unknown as { ReactDOM: typeof ReactDOMClient }).ReactDOM = ReactDOMClient
