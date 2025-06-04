import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { App as AntApp, ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
// import 'antd/dist/antd.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <AntApp>
        {' '}
        {/* Bu yerda App ni Ant Design App bilan o'rab olish */}
        <Provider store={store}>
          {' '}
          <App />
        </Provider>
      </AntApp>
    </ConfigProvider>
  </StrictMode>
)
