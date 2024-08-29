import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';

function TripCardImage(props: { cityName: string }) {                  //PER ORA DEPRECATO MA POTRA' SERVIRE PER RIEMPIRE I TRIP CON LE IMMAGINI
  const [image, setImage] = useState(null); 

  useEffect(() => {
    const fetchCityImage = async () => {
      try {
        const response = await axios.get('https://api.unsplash.com/photos/random', {
          params: {
            query: props.cityName + " from above",
            client_id: '4rjvZvwzFuPY3uX3WAnf2Qb8eWkwvDys-sdsyvDdai0',
          },
        });

        setImage(response.data.urls.regular);
      } catch (error) {
        console.error('Error fetching city image:', error);
      }
    };

    fetchCityImage();
  }, [props.cityName]);

  return (
    <div>
      {image && <Card.Img variant="top" src={image} />}
    </div>
  );
}

export default TripCardImage;
