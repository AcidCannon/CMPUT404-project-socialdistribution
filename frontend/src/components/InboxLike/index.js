import React from "react";
import { List, message, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getinboxlike } from "../../requests/requestLike";
import { getAuthorByAuthorID, getRemoteAuthorByAuthorID } from "../../requests/requestAuthor";
import { getHostname } from "../Utils";
import { auth } from "../../requests/URL";

export default class InboxLike extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      likelist: [],
      authorID: this.props.authorID,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    getinboxlike({ authorID: this.state.authorID }).then((res) => {
      if (res.status === 200) {
        this.getLikeDataSet(res.data).then((value) => {
          this.setState({ likelist: value });
        });
      } else {
        message.error("Request failed!");
      }
    });
  }
  getLikeDataSet = (likeData) => {
    let promise = new Promise(async (resolve, reject) => {
      const likeArray = [];
      for (const like of likeData) {
        const host = getHostname(like.author);
        let authorInfo;
        if (host !== window.location.hostname) {
          authorInfo = await getRemoteAuthorByAuthorID({
            URL: like.author,
            auth: auth,
          });
        } else {
          authorInfo = await getAuthorByAuthorID({
            authorID: like.author,
          });
        }
        likeArray.push({
          authorName: authorInfo.data.displayName,
          summary: like.summary,
        });
      }
      resolve(likeArray);
    });
    return promise;
  };

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { likelist } = this.state;
    return (
      <div style={{ margin: "0 20%" }}>
        {likelist.length === 0 ? (
          ""
        ) : (
          <List
            bordered
            itemLayout="horizontal"
            dataSource={likelist}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.authorName}
                  description={item.summary}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  }
}
