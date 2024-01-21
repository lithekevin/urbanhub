import { Layout, Row, Col, Image } from 'antd';

const { Footer } = Layout;  

function FooterComponent() { 
    return (
      <Footer className="footer-style">
      <Row justify="space-between" align="middle" style={{ paddingLeft: '5%', paddingRight: '5%'}}>
        <Col style={{ fontStyle: 'normal', display: 'flex', alignItems: 'center' }}>
          <Image src="/smart-city.png" alt="logo" style={{marginRight: '10px', marginBottom: '1rem', width: '30px', height: 'auto'}} preview={false}/>
          <p>UrbanHub - Inclusive And Effortless Urban Travel</p>
        </Col>
        <Col style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
          <p>Creators: Alessandro Bianco, Elia Ferraro, Kevin Gjeka, Sylvie Molinatto</p>
        </Col>
      </Row>
    </Footer>
    );
}

export default FooterComponent;