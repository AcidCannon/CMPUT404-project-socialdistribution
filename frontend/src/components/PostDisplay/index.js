import React from "react";
import { message, Avatar, Button, Card, List, Popover, Tag, Tabs } from "antd";
import {
  UserAddOutlined,
  HeartTwoTone,
  ShareAltOutlined,
  CommentOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import CommentArea from "../CommentArea";
import {
  getCommentList,
  getRemoteCommentList,
} from "../../requests/requestComment";
import {
  postRequest,
  postRemoteRequest,
} from "../../requests/requestFriendRequest";
import {
  getAuthorByAuthorID,
  getRemoteAuthorByAuthorID,
} from "../../requests/requestAuthor";
import EditPostArea from "../EditPostArea";
import ConfirmModal from "../ConfirmModal";
import CommentItem from "../SingleComment";
import {
  getLikes,
  sendLikes,
  getRemoteLikes,
  sendRemoteLikes,
} from "../../requests/requestLike";
import {
  deletePost,
  sendPost,
  sendPostToUserInbox,
} from "../../requests/requestPost";
import {
  getFollowerList,
  createFollower,
} from "../../requests/requestFollower";
import { domainAuthPair } from "../../requests/URL";
import {
  getDomainName,
  getLikeDataSet,
  formatDate,
  generateRandomAvatar,
  getRandomColor,
} from "../Utils";
import { sendToInbox } from "../../requests/requestInbox";

const { TabPane } = Tabs;
export default class PostDisplay extends React.Component {
  state = {
    comments: [],
    friendComments: [],
    isModalVisible: false,
    isEditModalVisible: false,
    isDeleteModalVisible: false,
    authorID: this.props.authorID,
    isLiked: false,
    likesList: [],
    isShared: this.props.rawPost.source !== this.props.rawPost.origin,
    followers: [],
  };

  componentDidMount() {
    getFollowerList({ object: this.state.authorID }).then((res) => {
      if (res.status === 200) {
        this.setState({ followers: res.data.items });
      }
    });

    // Comments
    if (this.props.remote) {
      getRemoteCommentList({
        URL: `${this.props.postID}/comments/`,
        auth: domainAuthPair[getDomainName(this.props.postID)],
      }).then((res) => {
        if (res.status === 200) {
          this.getCommentDataSet(res.data, true).then((value) => {
            this.setState({ comments: value });
            this.getVisibleComments(value);
          });
        }
      });
    } else {
      getCommentList({ postID: this.props.postID }).then((res) => {
        if (res.status === 200) {
          this.getCommentDataSet(res.data).then((value) => {
            this.setState({ comments: value });
            this.getVisibleComments(value);
          });
        }
      });
    }

    // Like
    if (this.props.remote) {
      getRemoteLikes({
        URL: `${this.props.postID}/likes/`,
        auth: domainAuthPair[getDomainName(this.props.postID)],
      }).then((res) => {
        if (res.status === 200) {
          getLikeDataSet(res.data).then((val) => {
            this.setState({ likesList: val });
            this.state.likesList.forEach((item) => {
              if (item.authorID === this.state.authorID) {
                this.setState({ isLiked: true });
              }
            });
          });
        } else {
          message.error("Remote: Request failed!");
        }
      });
    } else {
      getLikes({ _object: this.props.postID }).then((res) => {
        if (res.status === 200) {
          getLikeDataSet(res.data).then((val) => {
            this.setState({ likesList: val });
            this.state.likesList.forEach((item) => {
              if (item.authorID === this.state.authorID) {
                this.setState({ isLiked: true });
              }
            });
          });
        } else {
          message.error("Request failed!");
        }
      });
    }
  }

  getVisibleComments = (commentsList) => {
    // if used in inbox-post, only display current author's comments
    if (this.props.usage === "inbox") {
      const commentArray = [];
      commentsList.forEach((item) => {
        if (
          item.authorID.split("/")[4] === item.postID.split("/")[4] ||
          item.authorID === this.state.authorID
        ) {
          commentArray.push(item);
        }
      });
      this.setState({ friendComments: commentArray });
    }
  };

  getCommentDataSet = async (commentData, remote) => {
    const commentsArray = [];
    for (const comment of commentData) {
      let domain;
      domain = getDomainName(comment.author);
      let authorInfo;
      if (domain !== window.location.hostname) {
        authorInfo = await getRemoteAuthorByAuthorID({
          URL: comment.author,
          auth: domainAuthPair[domain],
        });
      } else {
        authorInfo = await getAuthorByAuthorID({
          authorID: comment.author,
        });
      }
      commentsArray.push({
        authorName: authorInfo.data.displayName,
        authorID: comment.author,
        comment: comment.comment,
        published: formatDate(comment.published),
        commentid: comment.id,
        eachCommentLike: false,
        postID: comment.post,
        actor: this.state.authorID,
        remote: this.props.remote,
      });
    }
    return commentsArray;
  };

  handleClickFollow = async () => {
    getAuthorByAuthorID({
      authorID: this.props.authorID,
    }).then((response1) => {
      var n = this.props.postID.indexOf("/posts/");
      var o = this.props.postID.indexOf("/author/");
      var m = this.props.authorID.indexOf("/author/");
      var length = this.props.authorID.length;
      let params = {
        type: "follow",
        actor: {
          type: "author",
          id: response1.data.id,
          host: response1.data.host,
          displayName: response1.data.displayName,
          url: response1.data.url,
          github: response1.data.github,
        },
        object: this.props.postID.substring(0, n),
        URL: `${this.props.postID.substring(0, n)}/inbox/`,
        summary: "I want to follow you!",
      };
      if (this.props.remote) {
        params.URL = this.props.postID.substring(0, o) + "/friendrequest/";
        params.actor = this.props.authorID;
        params.object = this.props.postID.substring(0, n);
        params.auth = domainAuthPair[getDomainName(this.props.postID)];
        // let params1 = {
        //   URL:
        //     this.props.postID.substring(0, n) +
        //     "/followers/" +
        //     this.props.authorID.substring(m + 8, length) +
        //     "/",
        //   auth: domainAuthPair[getDomainName(this.props.postID)],
        // };
        //createRemoteFollower(params1).then((response) => {
        //if (response.status === 204) {
        //message.success("Remote: Successfully followed!");
        //window.location.reload();
        //} else {
        //message.error("Remote: Follow Failed!");
        //}
        //});
        postRemoteRequest(params).then((response) => {
          if (response.status === 200) {
            message.success("Remote: Request sent!");
            window.location.reload();
          } else if (response.status === 409) {
            message.error("Remote: Invalid request!");
          } else {
            message.error("Remote: Request failed!");
          }
        });
      } else {
        let params1 = {
          actor: this.props.authorID.substring(m + 8, length),
          object: this.props.postID.substring(0, n),
        };
        createFollower(params1).then((response) => {
          if (response.status === 204) {
            message.success("Successfully followed!");
          } else if (response.status === 409) {
            message.warning("Can't follow yourself!");
          } else {
            message.warning("Already Following!");
          }
        });
        postRequest(params).then((response) => {
          if (response.status === 200) {
            message.success("Request sent!");
            window.location.reload();
          } else if (response.status === 409) {
            message.warning("Invalid request!");
          } else {
            message.error("Request failed!");
          }
        });
      }
    });
  };

  handleClickReply = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  handleClickShare = async () => {
    let rawPost = this.props.rawPost;
    rawPost.authorID = this.state.authorID;
    rawPost.author = this.state.authorID;
    rawPost.visibility = "FRIENDS";
    rawPost.source = this.state.authorID;
    // you cannot see unlisted, thus if you can share, it must be listed
    rawPost.unlisted = false;
    if (rawPost.source !== rawPost.origin) {
      //create a new post object
      sendPost(rawPost).then((response) => {
        if (response.status === 200) {
          const postData = response.data;
          postData.type = "post";
          //send to your friends's inbox
          for (const eachFollower of this.state.followers) {
            let params = {
              URL: `${eachFollower}/inbox/`,
              auth: domainAuthPair[getDomainName(eachFollower)],
              body: postData,
            };
            sendPostToUserInbox(params).then((response) => {
              if (response.status === 200) {
                message.success("Post shared!");
                window.location.reload();
              } else {
                message.error("Whoops, an error occurred while sharing.");
              }
            });
          }
        } else {
          message.error("Whoops, an error occurred while sharing.");
        }
      });
    } else {
      message.error("You cannot share your own post.");
    }
  };

  handleClickEdit = () => {
    this.setState({ isEditModalVisible: !this.state.isEditModalVisible });
  };

  handleClickDelete = () => {
    this.setState({ isDeleteModalVisible: !this.state.isDeleteModalVisible });
  };

  handleCommentModalVisiblility = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  handleEditPostModalVisiblility = () => {
    this.setState({ isEditModalVisible: !this.state.isEditModalVisible });
  };

  handleDeletePostModalVisiblility = () => {
    this.setState({ isDeleteModalVisible: !this.state.isDeleteModalVisible });
  };

  deleteSelectedPost = () => {
    deletePost({ postID: this.props.postID }).then((res) => {
      if (res.status === 200) {
        window.location.reload();
      } else {
        message.error("Fail to delete the post.");
      }
    });
  };

  handleClickLike = () => {
    if (this.state.isLiked === false) {
      this.setState({
        isLiked: true,
      });
      var n = this.props.postID.indexOf("/posts/");
      let params = {
        authorID: this.props.postID.substring(0, n),
        author: this.props.authorID,
        type: "Like",
        postID: this.props.postID,
        actor: this.props.authorID,
        object: this.props.postID,
        summary: "I like your post!",
        context: this.props.postID,
      };
      if (this.props.remote) {
        params.URL = `${this.props.postID}/likes/`;
        params.auth = domainAuthPair[getDomainName(params.URL)];

        sendRemoteLikes(params).then((response) => {
          if (response.status === 200) {
            message.success("Remote Likes sent!");
          } else {
            message.error("Remote likes send failed!");
          }
        });
      } else {
        sendLikes(params).then((response) => {
          if (response.status === 200) {
            message.success("Likes sent!");
          } else {
            message.error("Likes failed!");
          }
        });
        sendToInbox(params).then((response) => {
          if (response.status === 200) {
            message.success("Inbox Likes sent!");
          } else {
            message.error("Inbox Likes failed!");
          }
        });
      }
    } else {
      this.setState.isLiked = true;
    }
  };
  commentLikes = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  clickLikeComment = (item) => {
    if (item.eachCommentLike === false) {
      this.setState({
        eachCommentLike: true,
      });

      let params = {
        postID: this.props.postID,
        actor: this.props.authorID,
        object: item.commentid,
        summary: "I like your comment!",
        context: this.props.postID,
      };
      sendLikes(params).then((response) => {
        if (response.status === 200) {
          message.success("Likes sent!");
        } else {
          message.error("Likes failed!");
        }
      });
    }
  };

  render() {
    const {
      title,
      authorName,
      github,
      content,
      datetime,
      postID,
      categories,
      enableEdit,
      usage,
    } = this.props;

    const userInfo = (
      <div>
        <p>{authorName}</p>
        <p>{github}</p>
        <Button icon={<UserAddOutlined />} onClick={this.handleClickFollow} />
      </div>
    );

    const editButton = enableEdit ? (
      <Button
        type="text"
        style={{ color: "#C5C5C5" }}
        onClick={this.handleClickEdit}
      >
        <EditOutlined /> Edit
      </Button>
    ) : (
      ""
    );

    const deleteButton = enableEdit ? (
      <Button
        type="text"
        style={{ color: "#C5C5C5" }}
        onClick={this.handleClickDelete}
      >
        <DeleteOutlined /> Delete
      </Button>
    ) : (
      ""
    );

    const likeIconColor = this.state.isLiked ? "#eb2f96" : "#A5A5A5";

    const tags =
      categories !== undefined && typeof categories !== "string"
        ? categories.map((tag) => (
            <Tag key={tag} color={getRandomColor()}>
              {tag}
            </Tag>
          ))
        : "";

    const commentDataSource =
      usage === "inbox" ? this.state.friendComments : this.state.comments;

    return (
      <div>
        <Card
          title={
            <span>
              <ShareAltOutlined
                style={{
                  color: "#4E89FF",
                  display: this.state.isShared ? "" : "none",
                }}
              />
              <CloudServerOutlined
                style={{
                  color: "#4E89FF",
                  display: this.props.remote ? "" : "none",
                }}
              />
              {"  " + title}
            </span>
          }
          extra={
            <span>
              <Popover content={userInfo} title="User Info" trigger="click">
                <Avatar src={generateRandomAvatar(authorName)} /> {authorName}
              </Popover>
            </span>
          }
        >
          <div style={{ margin: "24px", textAlign: "center" }}>{content}</div>
          <div style={{ margin: "16px 0" }}>{tags}</div>
          <div>
            <HeartTwoTone
              twoToneColor={likeIconColor}
              onClick={this.handleClickLike}
            />
            <Button
              type="text"
              style={{ color: "#C5C5C5" }}
              onClick={this.handleClickReply}
            >
              <CommentOutlined /> Reply to
            </Button>

            <Button
              type="text"
              style={{ color: "#C5C5C5" }}
              onClick={this.handleClickShare}
            >
              <ShareAltOutlined /> Share
            </Button>
            {editButton}
            {deleteButton}
            <p
              style={{
                color: "#C5C5C5",
                fontSize: "small",
                float: "right",
              }}
            >
              {datetime}
            </p>
          </div>
          <div
            style={{
              clear: "both",
            }}
          />
          <Tabs
            defaultActiveKey="comments"
            type="card"
            size="small"
            style={{
              marginTop: "16px",
            }}
          >
            <TabPane tab="Comments" key="comments">
              {commentDataSource.length === 0 ? (
                ""
              ) : (
                <List
                  pagination={{
                    pageSize: 3,
                  }}
                  dataSource={commentDataSource}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar src={generateRandomAvatar(item.authorName)} />
                        }
                        title={item.authorName}
                        description={item.published}
                      />
                      {item.comment}
                      <CommentItem item={item} />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
            <TabPane tab="Likes" key="likes">
              {this.state.likesList.length === 0 ? (
                ""
              ) : (
                <List
                  pagination={{
                    pageSize: 3,
                  }}
                  dataSource={this.state.likesList}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar src={generateRandomAvatar(item.authorName)} />
                        }
                        title={item.authorName}
                        description={"likes this post."}
                      />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
          </Tabs>

          <CommentArea
            authorID={this.props.authorID}
            postID={postID}
            visible={this.state.isModalVisible}
            handleCommentModalVisiblility={this.handleCommentModalVisiblility}
            remote={this.props.remote}
          />
          <EditPostArea
            authorID={this.props.authorID}
            postID={postID}
            visible={this.state.isEditModalVisible}
            handleEditPostModalVisiblility={this.handleEditPostModalVisiblility}
          />
          <ConfirmModal
            visible={this.state.isDeleteModalVisible}
            handleConfirmModalVisiblility={
              this.handleDeletePostModalVisiblility
            }
            dosomething={this.deleteSelectedPost}
          />
        </Card>
      </div>
    );
  }
}
