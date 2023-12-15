import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { Attraction } from "../../models/attraction";

// Get the firestore db instance
const db = getFirestore(app);

// Get the reference to the collection (table) trips

const attractionsCollection = collection(db, "attractions");



// Write all available attractions in the db (once) just to setup the db

export const setAttractions = async (): Promise<void> => {
  const attractions = [
    { id: "A001", name: "Sagrada Familia", city: "Barcelona", location: { latitude: 41.4036, longitude: 2.1744 }, estimatedTime: 150 },
    { id: "A002", name: "Park Guell", city: "Barcelona", location: { latitude: 41.4145, longitude: 2.1527 }, estimatedTime: 90 },
    { id: "A003", name: "Casa Batllo", city: "Barcelona", location: { latitude: 41.3916, longitude: 2.1649 }, estimatedTime: 110 },
    { id: "A004", name: "Casa Mila", city: "Barcelona", location: { latitude: 41.3954, longitude: 2.1619 }, estimatedTime: 130 },
    { id: "A005", name: "Casa Vicens", city: "Barcelona", location: { latitude: 41.4036, longitude: 2.1744 }, estimatedTime: 100 },
    { id: "A006", name: "Casa de les Punxes", city: "Barcelona", location: { latitude: 41.3954, longitude: 2.1619 }, estimatedTime: 120 },
    { id: "A007", name: "Casa Amatller", city: "Barcelona", location: { latitude: 41.3916, longitude: 2.1649 }, estimatedTime: 140 },
    { id: "A008", name: "Casa Lleo Morera", city: "Barcelona", location: { latitude: 41.4145, longitude: 2.1527 }, estimatedTime: 110 },
    { id: "A009", name: "Casa de la Seda", city: "Barcelona", location: { latitude: 41.4036, longitude: 2.1744 }, estimatedTime: 160 },
    { id: "A010", name: "Casa de la Llotja de Mar", city: "Barcelona", location: { latitude: 41.3954, longitude: 2.1619 }, estimatedTime: 80 },
    { id: "A011", name: "Big Ben", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 170 },
    { id: "A012", name: "Tower Bridge", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 110 },
    { id: "A013", name: "Tower of London", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 130 },
    { id: "A014", name: "London Eye", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 140 },
    { id: "A015", name: "Buckingham Palace", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 120 },
    { id: "A016", name: "Westminster Abbey", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 100 },
    { id: "A017", name: "St Paul's Cathedral", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 90 },
    { id: "A018", name: "Trafalgar Square", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 150 },
    { id: "A019", name: "The Shard", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 80 },
    { id: "A020", name: "British Museum", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 130 },
    { id: "A021", name: "Natural History Museum", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 110 },
    { id: "A022", name: "Victoria and Albert Museum", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 120 },
    { id: "A023", name: "Science Museum", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 140 },
    { id: "A024", name: "National Gallery", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 100 },
    { id: "A025", name: "Madame Tussauds London", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 160 },
    { id: "A026", name: "Churchill War Rooms", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 120 },
    { id: "A027", name: "Royal Observatory Greenwich", city: "London", location: { latitude: 51.5007, longitude: 0.1246 }, estimatedTime: 90 },
    { id: "A028", name: "Mozarthaus Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A029", name: "Schönbrunn Palace", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 110 },
    { id: "A030", name: "Belvedere Palace", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A031", name: "Hofburg Palace", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A032", name: "St. Stephen's Cathedral", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 100 },
    { id: "A033", name: "Vienna State Opera", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 160 },
    { id: "A034", name: "Prater", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 80 },
    { id: "A035", name: "Kunsthistorisches Museum Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A036", name: "Albertina", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 110 },
    { id: "A037", name: "Museum of Natural History Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A038", name: "Hundertwasserhaus", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A039", name: "St. Peter's Church", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 150 },
    { id: "A040", name: "KunstHausWien", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 90 },
    { id: "A041", name: "Museum of Technology Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 160 },
    { id: "A042", name: "Museum of Military History Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A043", name: "Museum of Illusions Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A044", name: "Leopold Museum", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A045", name: "Museum of Applied Arts Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 110 },
    { id: "A046", name: "Museum of Art Fakes", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A047", name: "Museum of Contraception and Abortion", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A048", name: "Museum of Chocolate and Cocoa Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A049", name: "Museum of Clocks and Watches Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 150 },
    { id: "A050", name: "Museum of the History of Medicine Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 160 },
    { id: "A051", name: "Museum of the History of Dentistry Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A052", name: "Museum of the History of Pharmacy Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A053", name: "Museum of the History of Military Post Service Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A054", name: "Museum of the History of the City of Vienna", city: "Vienna", location: { latitude: 48.2082, longitude: 16.373 }, estimatedTime: 110 },
    { id: "A055", name: "Museum of the History of the Vienna Technical University", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 120 },
    { id: "A056", name: "Museum of the History of the Vienna Police Force", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 130 },
    { id: "A057", name: "Museum of the History of the Vienna Fire Brigade", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 140 },
    { id: "A058", name: "Museum of the History of the Vienna Technical Museum", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 150 },
    { id: "A059", name: "Museum of the History of the Vienna Public Transport System", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 160 },
    { id: "A060", name: "Museum of the History of the Vienna General Hospital", city: "Vienna", location: { latitude: 48.2082, longitude: 16.3738 }, estimatedTime: 180 },
  ];
  

  try{

    attractions.forEach(async (attraction) => {
      const attractionDocRef = doc(attractionsCollection, attraction.id);
      
      await setDoc(attractionDocRef, attraction);
      });

  } catch (error) {
    console.error("Error during the writing of attractions data:", error);
    throw error;
  }
  
}


// Read example
export const getAttractions = async (): Promise<Attraction[]> => {
  try {
    const documents: Attraction[] = (
      await getDocs(attractionsCollection)
    ).docs.map((doc) => {
      const data = doc.data();
      let attraction = {
        id: doc.id,
        name: data.name,
        city: data.city,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        estimatedTime: data.estimatedTime,
      } as Attraction;

      return attraction;
    });

    return documents;
  } catch (error) {
    console.error("Error during the reading of attractions data:", error);
    throw error;
  }
};


