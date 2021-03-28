import React from "react";
import { List, message, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getRequest } from "../../requests/requestFriendRequest";
import { getAuthorByAuthorID } from "../../requests/requestAuthor";
import SingleRequest from "../SingleRequest";

export default class InboxRequest extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      requestDataSet: [],
      authorID: this.props.authorID,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    getRequest({
      authorID: this.state.authorID,
    }).then((res) => {
      if (res.status === 200) {
        this.getRequestDataSet(res.data).then((value) => {
          this.setState({ requestDataSet: value });
        });
      } else {
        message.error("Fail to get my requests.");
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getRequestDataSet = (requestData) => {
    let promise = new Promise(async (resolve, reject) => {
      const requestSet = [];
      for (const element of requestData) {
        const res = await getAuthorByAuthorID({ authorID: element.actor });
        console.log("test5", element.actor);
        requestSet.push({
          actorName: res.data.displayName,
          actorID: element.actor,
        });
      }
      resolve(requestSet);
    });

    return promise;
  };

  render() {
    const { requestDataSet } = this.state;

    return (
      <div style={{ margin: "0 20%" }}>
        <List
          bordered
          itemLayout="horizontal"
          dataSource={requestDataSet}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.actorName}
                description=" wants to follow you."
              />
              <SingleRequest
                authorID={this.state.authorID}
                actorID={item.actorID}
              />
            </List.Item>
          )}
        />
      </div>
    );
  }
}