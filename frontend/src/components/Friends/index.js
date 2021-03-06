import React from "react";
import { List, Avatar, Spin } from "antd";
import { getFriendList, getFriend } from "../../requests/requestFriends";
import {
  getAuthorByAuthorID,
  getRemoteAuthorByAuthorID,
} from "../../requests/requestAuthor";
import SingleFriend from "../SingleFriend";
import { generateRandomAvatar, getDomainName } from "../Utils";
import { domainAuthPair } from "../../requests/URL";

export default class Friends extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      authorID: this.props.authorID,
      friends: [],
      remoteFriendList: [],
      loading: true,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    let remoteFriends = [];
    let localFriends = [];
    getFriendList({ object: this.state.authorID }).then((res) => {
      if (res.data.items.length !== 0) {
        for (const friend_id of res.data.items) {
          let domain = getDomainName(friend_id);
          let n = this.state.authorID.indexOf("/author/");
          if (domain !== window.location.hostname) {
            getRemoteAuthorByAuthorID({
              URL: friend_id,
              auth: domainAuthPair[domain],
            }).then((response2) => {
              const obj = {
                displayName: response2.data.displayName,
                github: response2.data.github,
                id: response2.data.id,
              };
              remoteFriends.push(obj);
              this.setState({
                friends: localFriends,
                remoteFriendList: remoteFriends,
              });
            });
          } else {
            getAuthorByAuthorID({
              authorID: friend_id,
            }).then((response2) => {
              const obj = {
                displayName: response2.data.displayName,
                github: response2.data.github,
                id: response2.data.id,
              };
              localFriends.push(obj);
              this.setState({
                friends: localFriends,
                remoteFriendList: remoteFriends,
              });
            });
          }
        }
      }
      this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const allFriends = this.state.friends.concat(this.state.remoteFriendList);
    return (
      <div style={{ margin: "0 20%" }}>
        {this.state.loading ? (
          <div style={{ textAlign: "center", marginTop: "20%" }}>
            <Spin size="large" /> Loading...
          </div>
        ) : (
          <List
            bordered
            pagination={{
              pageSize: 10,
            }}
            dataSource={allFriends}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar src={generateRandomAvatar(item.displayName)} />
                  }
                  title={item.displayName}
                  description={item.github}
                />
                <SingleFriend
                  authorID={this.state.authorID}
                  friendID={item.id}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  }
}
