import React, { useEffect, useState } from "react";
import { Badge, Button, Col, Flex, Modal, Row, Tag, Timeline, Typography } from "antd";
import { EuroCircleOutlined, EditTwoTone, DeleteTwoTone, InfoCircleOutlined, } from "@ant-design/icons";
import { TbCar, TbWalk } from "react-icons/tb";
import { deleteAttraction } from "../../firebase/daos/dao-trips";
import { TripAttraction } from "../../models/tripAttraction";
import { Trip } from "../../models/trip";
import colors from "../../style/colors";
import dayjs from "dayjs";
import { MessageInstance } from "antd/es/message/interface";

const { Link, Text, Title } = Typography;

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
  modifiedByChatbot: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
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
    modifiedByChatbot
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
        `https://en.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(
          attraction.name + ", " + trip?.city
        )}&format=json`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.query.search.length > 0) {
            const pageTitle = data.query.search[0].title;
            const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
            setWikipediaUrls((prevUrls) => ({
              ...prevUrls,
              [attraction.name]: pageUrl,
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
                        fontWeight: "500",
                      }}
                    >
                      {attraction.name}
                    </Title>
                    <div className="button-container">
                      {editing && !attraction.startDate.isBefore(dayjs().startOf('day')) && (
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
                      {editing && !attraction.startDate.isBefore(dayjs().startOf('day')) && (
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
                  <Row justify={"space-between"} style={{marginTop: "20px"}}>
                    <Col>
                      <div
                        className="read-more-link"
                      >
                        <Link
                          href={wikipediaUrls[attraction.name]}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "black",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            cursor: 'pointer'
                          }}
                        >
                          <InfoCircleOutlined size={25} style={{ marginRight: '2px' }} />
                          <Text underline>Read more...</Text>
                        </Link>
                      </div>
                    </Col>
                    <Col>
                      <Tag
                        icon={<EuroCircleOutlined />}
                        color="green"
                        style={{ textAlign: "center", display: "table" , width: "100%"}}
                      >
                        {" "}
                        {attraction.perPersonCost
                          ? attraction.perPersonCost * (trip!.nAdults + trip!.nChildren)
                          : "free"}
                      </Tag>
                    </Col>
                  </Row>
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
            <strong>Time slot:</strong> {attraction.startDate.format("HH:mm")} - {attraction.endDate.format("HH:mm")}
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
            modifiedByChatbot.setter(true);

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
      okText: "Yes, delete it",
      cancelText: "No, cancel",
      okButtonProps: { danger: true },
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
      {/*contextHolder*/}
      <Timeline mode="alternate" items={timelineItems} />
    </>
  );
}

export default DailyAttractions;
