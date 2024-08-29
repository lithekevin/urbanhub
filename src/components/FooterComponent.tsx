import { Col, Image, Layout, Row, Typography } from 'antd';

const { Footer } = Layout;  
const { Title, Paragraph } = Typography;

function FooterComponent() { 
    return (
      <Footer className="footer-style">
        <Row justify="space-between" align="middle" style={{ paddingLeft: '4%', paddingRight: '4%'}}>
          <Col span={8} style={{ fontStyle: 'normal'}}>
              <Col>
                <Image src="/logo.png" alt="logo" style={{ marginBottom: '1rem', width: '30px', height: 'auto'}} preview={false}/>
              </Col>
              <Col>
                <Title level={4}>UrbanHUB</Title>
              </Col>
            <Paragraph>Inclusive And Effortless Urban Travel</Paragraph>
          </Col>
          <Col span={8} style={{ fontStyle: 'italic'}}>
            <Title level={5} style={{ marginBottom: 0 }}>Creators:</Title>
            <Paragraph style={{ marginBottom: 0 }}><a href="https://github.com/alewhite11" title='Alessandro Bianco'>Alessandro Bianco</a></Paragraph>
            <Paragraph style={{ marginBottom: 0 }}><a href="https://github.com/0-Elia-0" title='Elia Ferraro'>Elia Ferraro</a></Paragraph>
            <Paragraph style={{ marginBottom: 0 }}><a href="https://github.com/lithekevin" title='Kevin Gjeka'>Kevin Gjeka</a></Paragraph>
            <Paragraph style={{ marginBottom: 0 }}><a href="https://github.com/Sylvie-Molinatto" title="Sylvie Molinatto">Sylvie Molinatto</a></Paragraph>
          </Col>
          <Col span={8} style={{ fontStyle: 'normal'}}>
          <Title level={5} style={{ marginBottom: 0 }}>Attributions:</Title>
            <Paragraph style={{ marginBottom: 0, fontSize: '13px' }}>Logo icon made by <a href="https://www.flaticon.com/authors/rooman12" title="Rooman12"> Rooman12 </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></Paragraph>
            <Paragraph style={{ marginBottom: 0, fontSize: '13px' }}>Marker icon made by <a href="https://www.flaticon.com/authors/ranksol-graphics" title="ranksol graphics"> ranksol graphics </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></Paragraph>
            <Paragraph style={{ marginBottom: 0, fontSize: '13px' }}>Marker icon made by <a href="https://www.flaticon.com/authors/mia-elysia" title="mia elysia"> mia elysia </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></Paragraph>
          </Col>
        </Row>
      </Footer>
    );
}

export default FooterComponent;