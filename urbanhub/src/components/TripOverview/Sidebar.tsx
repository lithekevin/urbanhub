import React from "react";
import { Col } from "react-bootstrap";
import {
  Alert,
  Collapse,
  CollapseProps,
  Typography,
  Button,
  Flex,
  Spin,
  Tooltip,
} from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Trip } from "../../models/trip";
import colors from "../../style/colors";
import DailyAttractions from "./DailyAttractions";
import dayjs from "dayjs";
import { TripAttraction } from "../../models/tripAttraction";
import { MessageInstance } from "antd/es/message/interface";

const { Title, Paragraph } = Typography;

interface SidebarProps {
  activeKeyState: {
    value: string | string[];
    setter: React.Dispatch<React.SetStateAction<string | string[]>>;
  };
  attractionDistances: string[];
  dayLabels: string[];
  editing: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  errorState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  form: any;
  loadingState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
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
  tripState: {
    value: Trip | null;
    setter: React.Dispatch<React.SetStateAction<Trip | null>>;
  };
  attractionCardHoveredID: {
    value: string | null;
    setter: React.Dispatch<React.SetStateAction<string | null>>;
  };
}

function Sidebar(props: SidebarProps) {
  const {
    activeKeyState,
    attractionDistances,
    dayLabels,
    editing,
    form,
    errorState,
    loadingState,
    messageApi,
    setDirty,
    setEditingAttraction,
    setIsFormVisible,
    setMessageAI,
    setSelectedAttractionId,
    setSelectedDay,
    setUndoVisibility,
    travelModel,
    trip,
    tripId,
    tripState,
    contextHolder,
    attractionCardHoveredID,
  } = props;

  const dailyActivities: CollapseProps["items"] = dayLabels.map(
    (dayLabel, index) => ({
      key: `${index}`,
      label: dayLabel,
      children: (
        <div>
          <DailyAttractions
            attractionDistances={attractionDistances}
            editing={editing.value}
            form={form}
            day={dayjs(dayLabel, "DD/MM/YYYY")}
            messageApi={messageApi}
            contextHolder={contextHolder}
            setDirty={setDirty}
            setEditingAttraction={setEditingAttraction}
            setIsFormVisible={setIsFormVisible}
            setMessageAI={setMessageAI}
            setSelectedAttractionId={setSelectedAttractionId}
            setSelectedDay={setSelectedDay}
            setUndoVisibility={setUndoVisibility}
            travelModel={travelModel}
            trip={trip}
            tripId={tripId}
            attractionCardHoveredID={{
              value: attractionCardHoveredID.value,
              setter: attractionCardHoveredID.setter,
            }}
          />
        </div>
      ),
    })
  );

  return (
    <>
      {loadingState.value && (
        <Spin tip="Loading" size="large" fullscreen/>
      )}
      {errorState.value && (
        <Col>
          <Alert
            message={<Title level={3}>Oh snap! You got an error!</Title>}
            showIcon
            description={
              <>
                <Paragraph> Error while loading trips. </Paragraph>
                <Paragraph> Please refresh the page. </Paragraph>
              </>
            }
            type="error"
            style={{ width: "fit-content", margin: "auto", marginTop: "20px" }}
          />
        </Col>
      )}
      {!loadingState.value && !errorState.value && tripState.value && (
        <>
          <div>
            <Flex style={{ display: "flex", alignItems: "center" }}>
              <Title
                level={2}
                className="text-left"
                style={{ marginRight: "1vw" }}
              >
                {tripState.value.city}
              </Title>
              {!dayjs(tripState.value.endDate).isBefore(dayjs()) && (
                <Tooltip
                  title={
                    editing.value === true
                      ? "Exit edit mode"
                      : "Enter edit mode"
                  }
                  placement="right"
                >
                  <Button
                    size="middle"
                    type="primary"
                    className="button-new-trip"
                    style={{
                      backgroundColor: colors.whiteBackgroundColor,
                      borderColor: colors.primaryButtonColor,
                      color: "black",
                      textAlign: "center",
                      fontSize: "15px",
                      marginBottom: "10px",
                      marginRight: "1vw",
                    }}
                    onClick={() => {
                      !editing.value
                        ? editing.setter(true)
                        : editing.setter(false);
                    }}
                  >
                    <span>
                      {!editing.value ? <EditOutlined style={{ color: colors.primaryButtonColor }}/> : <EyeOutlined style={{ color: colors.primaryButtonColor }}/>}
                    </span>
                  </Button>
                </Tooltip>
              )}
            </Flex>
          </div>
          <div className="sidebar-div">
            <Collapse
              size="large"
              items={dailyActivities}
              accordion={true}
              activeKey={activeKeyState.value}
              onChange={(keys) => activeKeyState.setter(keys)}
            />
          </div>
        </>
      )}
    </>
  );
}

export default Sidebar;
