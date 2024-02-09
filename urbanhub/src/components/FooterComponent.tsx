import { Layout, Row, Col, Image } from 'antd';

const { Footer } = Layout;  

function FooterComponent() { 
    return (
      <Footer className="footer-style">
      <Row justify="space-between" align="middle" style={{ paddingLeft: '5%', paddingRight: '5%'}}>
        <Col style={{ fontStyle: 'normal', display: 'flex', alignItems: 'center' }}>
          <Image src="/logo.png" alt="logo" style={{marginRight: '10px', marginBottom: '1rem', width: '30px', height: 'auto'}} preview={false}/>
          <p>UrbanHub - Inclusive And Effortless Urban Travel</p>
        </Col>
        <Col style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
          <p>Creators: Alessandro Bianco, Elia Ferraro, Kevin Gjeka, Sylvie Molinatto</p>
        </Col>
        <Col style={{ fontStyle: 'normal' }}>
          <p> Icons made by <a href="https://www.flaticon.com/authors/rooman12" title="Rooman12"> Rooman12 </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></p>
        </Col>
      </Row>
    </Footer>
    );
}

export default FooterComponent;