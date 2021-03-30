import React from "react";
import { message } from "antd";
import { HeartTwoTone } from "@ant-design/icons";
import {
  getAuthorByAuthorID,
  getRemoteAuthorByAuthorID,
} from "../../requests/requestAuthor";
import {
  sendLikes,
  getLikes,
  getRemoteLikes,
  sendRemoteLikes,
} from "../../requests/requestLike";

export default class CommentItem extends React.Component {
  state = {
    authorID: this.props.item.actor,
    isLiked: false,
    likesList: [],
    num: 0,
  };

  componentDidMount() {
    if (this.props.item.remote) {
      getRemoteLikes({
        URL: `${this.props.item.commentid}/likes/`,
        auth: this.props.remoteAuth,
      }).then((res) => {
        if (res.status === 200) {
          this.getLikeDataSet(res.data).then((val) => {
            this.setState({ likesList: val });
            this.state.likesList.forEach((item) => {
              if (item.authorID === this.state.authorID) {
                this.setState({ isLiked: true });
              }
            });
          });
        } else {
          message.error("Request remote comment like failed!");
        }
      });
    } else {
      getLikes({ _object: this.props.item.postID }).then((res) => {
        if (res.status === 200) {
          this.getLikeDataSet(res.data).then((val) => {
            this.setState({ likesList: val, num: val.length });
            this.state.likesList.forEach((item) => {
              if (item.authorID === this.state.authorID) {
                this.setState({ isLiked: true });
              }
            });
          });
        } else {
          message.error("Request comment like failed!");
        }
      });
    }
  }
  getLikeDataSet = (likeData, remote) => {
    let promise = new Promise(async (resolve, reject) => {
      const likeArray = [];
      for (const like of likeData) {
        let authorInfo;
        if (this.props.remote) {
          authorInfo = await getRemoteAuthorByAuthorID({
            URL: like.author,
            auth: this.props.remoteAuth,
          });
        } else {
          authorInfo = await getAuthorByAuthorID({
            authorID: like.author,
          });
        }
        likeArray.push({
          authorName: authorInfo.data.displayName,
          authorID: authorInfo.data.id,
        });
      }
      resolve(likeArray);
    });
    return promise;
  };

  clickLikeComment = (item) => {
    if (this.state.isLiked === false) {
      this.setState({
        isLiked: true,
      });
      console.log("1", this.props.item);
      let params = {
        postID: this.props.item.postID,
        actor: this.props.item.actor,
        object: this.props.item.commentid,
        summary: "I like you comment!",
        context: this.props.item.postID,
      };
      if (this.props.remote) {
        params.URL = `${this.props.postID}/likes/`;
        params.auth = this.props.remoteAuth;
        params.author = this.props.remoteAuthorID;
        sendRemoteLikes(params).then((response) => {
          if (response.status === 200) {
            message.success("Likes remote sent!");
          } else {
            message.error("Likes remote get failed!");
          }
        });
      } else {
        console.log("para", params);
        sendLikes(params).then((response) => {
          if (response.status === 200) {
            message.success("Likes sent!");
          } else {
            message.error("Likes failed!");
          }
        });
      }
    }
  };

  render() {
    const likeIconColor = this.state.isLiked ? "#eb2f96" : "#A5A5A5";

    return (
      <div style={{ float: "right" }}>
        <HeartTwoTone
          twoToneColor={likeIconColor}
          onClick={this.clickLikeComment}
        />{" "}
        {this.state.num}
      </div>
    );
  }
}