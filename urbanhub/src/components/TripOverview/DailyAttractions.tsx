import React, { useEffect, useState } from "react";
import { Badge, Button, Flex, Modal, Tag, Timeline, Typography } from "antd";
import {
  EuroCircleOutlined,
  EditTwoTone,
  DeleteTwoTone,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { TbCar, TbWalk } from "react-icons/tb";
import { deleteAttraction } from "../../firebase/daos/dao-trips";
import { TripAttraction } from "../../models/tripAttraction";
import { Trip } from "../../models/trip";
import colors from "../../style/colors";
import dayjs from "dayjs";
import { MessageInstance } from "antd/es/message/interface";

const { Title } = Typography;

interface DailyAttractionsProps {
  attractionDistances: string[];
  day: dayjs.Dayjs;
  editing: boolean;
  form: any;
  messageApi: MessageInstance;
  contextHolder: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingAttraction: React.Dispatch<
    React.SetStateAction<TripAttraction | null>
  >;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageAI: React.Dispatch<React.SetStateAction<string>>;
  setSelectedAttractionId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDay: React.Dispatch<React.SetStateAction<dayjs.Dayjs | null>>;
  setUndoVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  travelModel: string;
  trip: Trip | null;
  tripId: string | undefined;
  attractionCardHoveredID: {
    value: string | null;
    setter: React.Dispatch<React.SetStateAction<string | null>>;
  };
}

function DailyAttractions(props: DailyAttractionsProps) {
  const {
    attractionDistances,
    day,
    editing,
    form,
    messageApi,
    contextHolder,
    setDirty,
    setEditingAttraction,
    setIsFormVisible,
    setSelectedAttractionId,
    setSelectedDay,
    setUndoVisibility,
    travelModel,
    trip,
    tripId,
    attractionCardHoveredID,
  } = props;

  let attractionsForDay: TripAttraction[] = [];
  let closestKey: dayjs.Dayjs | null = null; // Find the closest matching key
  let minDifference: number | null = null;

  trip?.schedule.forEach((attractions, key) => {
    const difference = Math.abs(day.diff(key, "days"));
    if (minDifference === null || difference < minDifference) {
      minDifference = difference;
      closestKey = key;
    }
  });

  if (closestKey !== null) {
    attractionsForDay = trip?.schedule.get(closestKey) || [];
  }

  const [wikipediaUrls, setWikipediaUrls] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    attractionsForDay.forEach((attraction) => {
      fetch(
        `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&search=${encodeURIComponent(
          attraction.name + " " + trip?.city
        )}&limit=1&namespace=0&format=json`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data[3].length > 0) {
            setWikipediaUrls((prevUrls) => ({
              ...prevUrls,
              [attraction.name]: data[3][0],
            }));
          }
        })
        .catch((error) => console.error(error));
    });
  }, [attractionsForDay]);

  const timelineItems = attractionsForDay.flatMap((attraction, index) => {
    let distanceInMeter = 0;
    let distance;

    // Add distance text between attractions
    if (index < attractionsForDay.length - 1) {
      distance = attractionDistances[index];

      if (distance) {
        if (distance.includes("km")) {
          distanceInMeter = parseFloat(distance.split(" ")[0]) * 1000;
        } else {
          distanceInMeter = parseFloat(distance.split(" ")[0]);
        }
      }
    }

    const items: any[] = [
      {
        label: `${attraction.startDate.format(
          "HH:mm"
        )} - ${attraction.endDate.format("HH:mm")}`,
        children: (
          <div
            onMouseEnter={() => attractionCardHoveredID.setter(attraction.id)}
            onMouseLeave={() => attractionCardHoveredID.setter(null)}
          >
            <Badge.Ribbon
              text={index + 1}
              placement="start"
              style={{
                backgroundColor: "#185b6f",
                color: "#185b6f",
                fontWeight: "bolder",
                fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
                fontSize: "12px",
              }}
            >
              <div className="static-popover">
                <div className="content">
                  <Flex justify="space-between" align="center">
                    <Title
                      style={{
                        textAlign: "left",
                        fontSize: "18px",
                        color: "#185b6f",
                        fontWeight: "bold",
                      }}
                    >
                      {attraction.name}
                    </Title>
                    <div className="button-container">
                      {editing && (
                        <Button
                          onClick={() => handleEditClick(attraction)}
                          icon={
                            <EditTwoTone
                              twoToneColor={colors.primaryButtonColor}
                            />
                          }
                          style={{ marginRight: "2%" }}
                          className="edit-button"
                          type="text"
                        />
                      )}
                      {editing && (
                        <Button
                          onClick={() => handleDeleteClick(attraction)}
                          icon={
                            <DeleteTwoTone
                              twoToneColor={colors.deleteButtonColor}
                            />
                          }
                          className="delete-button"
                          type="text"
                        />
                      )}
                    </div>
                  </Flex>
                  <a
                    href={wikipediaUrls[attraction.name]}
                    target="_blank"
                    style={{
                      color: "black",
                      textDecoration: "none",
                      textAlign: "left",
                    }}
                  >
                    <Flex align="center" className="mb-3">
                      <InfoCircleOutlined />
                      <p className="ms-1 my-auto">read more...</p>
                    </Flex>
                  </a>
                  <Tag
                    icon={<EuroCircleOutlined />}
                    color="green"
                    style={{ textAlign: "left", display: "table" }}
                  >
                    {" "}
                    {attraction.perPersonCost
                      ? attraction.perPersonCost * (trip!.nAdults + trip!.nKids)
                      : "free"}
                  </Tag>
                </div>
              </div>
            </Badge.Ribbon>
          </div>
        ),
        position: index % 2 === 0 ? "left" : "right",
        color: "#185b6f",
      },
    ];

    // Push item conditionally
    if (index < attractionsForDay.length - 1) {
      items.push({
        dot:
          travelModel === "DRIVING" ? (
            <TbCar className="fs-5" />
          ) : distanceInMeter > 2000 ? (
            <TbCar className="fs-5" />
          ) : (
            <TbWalk className="fs-5" />
          ),
        children: distance,
        color: "black",
      });
    }

    return items;
  });

  const handleDeleteClick = async (attraction: TripAttraction) => {
    // Display a custom confirmation dialog
    Modal.confirm({
      title: "Delete Attraction",
      content: (
        <div>
          <p>Are you sure you want to delete this attraction?</p>
          <p>
            <strong>Name:</strong> {attraction.name}
            <br />
            <strong>Date:</strong> {attraction.startDate.format("DD/MM/YYYY")}
            <br />
          </p>
        </div>
      ),
      centered: true,
      onOk: async () => {
        try {
          if (tripId) {
            await deleteAttraction(tripId, attraction.startDate, attraction.id);
            setDirty(true);
            setUndoVisibility(false);

            // Show success message
            messageApi.open({
              type: "success",
              content: "Attraction deleted successfully!",
              duration: 3,
              style: {
                marginTop: "70px",
              },
            });
          }
        } catch (error) {
          console.error("Error deleting attraction:", error);

          // Show error message
          messageApi.open({
            type: "error",
            content: "Error while deleting attraction!",
            duration: 3,
            style: {
              marginTop: "70px",
            },
          });
        }
      },
    });
  };

  const handleEditClick = (attraction: TripAttraction) => {
    form.setFieldsValue({
      attraction: attraction.name,
      date: dayjs(attraction.startDate, "DD/MM/YYYY"),
      startTime: dayjs(attraction.startDate, "HH:mm"),
      endTime: dayjs(attraction.endDate, "HH:mm"),
    });
    setSelectedAttractionId(attraction.id);
    setSelectedDay(dayjs(attraction.startDate, "DD/MM/YYYY"));
    setEditingAttraction(attraction);
    setIsFormVisible(true);
  };

  return (
    <>
      {contextHolder}
      <Timeline mode="alternate" items={timelineItems} />
    </>
  );
}

export default DailyAttractions;
