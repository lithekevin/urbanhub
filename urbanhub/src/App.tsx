import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import { Row } from 'react-bootstrap';


function App() {
  return (
    <BrowserRouter>
      <Main/>
    </BrowserRouter>
  );
}

function Main() {
  return (
    <Routes>
      <Route path="/" element={<PageLayout/>}>
        <Route index path='/' element={<div>HomePage</div> /* TODO: Start designing pages from here */}/>
      </Route>

      <Route path="*" element={<div>404</div> /* TODO: Design not found page */}/>
    </Routes>
  );
}

function PageLayout() {
  return (
    <Row className='w-100 m-0 p-0'>
      <Outlet/>
    </Row>
  );
}

export default App;
