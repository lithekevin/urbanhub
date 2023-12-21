import { Container } from "react-bootstrap";

function FooterComponent() {
    return (
        <Container fluid className="footerClass position-relative d-flex flex-column align-items-center">

            <p className="text-center">Human Computer Interaction - Politecnico di Torino</p>

            <p className="text-center">Students: {"("}User Centered Innovators{")"} Alessandro Bianco, Elia Ferraro, Kevin Gjeka, Sylvie Molinatto</p>

            <p className="text-center">Professors: Luigi De Russis, Tommaso Calò, Alberto Monge Roffarello</p>

            <p className="text-center">2023/2024</p>

        </Container>
    );
}

export default FooterComponent;