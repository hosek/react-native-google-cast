import { ActionSheetProps } from '@expo/react-native-action-sheet'
import React from 'react'
import {
  EmitterSubscription,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  Button,
} from 'react-native'
import { Navigation, Options } from 'react-native-navigation'
import GoogleCast, { CastState, RemoteMediaClient } from '../../../lib'
import Video from '../Video'

export interface Props extends ActionSheetProps {
  componentId: string
}

interface State {
  connected: boolean
  videos: Video[]
  routes: Array<{ id: string, name: string }>
}

class HomeScreen extends React.Component<Props, State> {
  static options(passProps): Options {
    return {
      topBar: {
        title: {
          alignment: 'center',
          color: 'white',
          text: 'CastVideos',
        },
        rightButtons: [
          {
            id: 'cast',
            component: {
              name: 'castvideos.CastButton',
            },
          },
        ],
      },
    }
  }

 
 


  castStateListener: EmitterSubscription
  state: State = {
    connected: false,
    videos: [],
    routes:[],
  }

  componentDidMount() {
    Navigation.events().bindComponent(this)

    const setConnected = (state: CastState) => {
      this.setState({
        connected: state === 'connected',
      })

      Navigation.mergeOptions(this.props.componentId, {
        topBar: {
          rightButtons: [
            {
              id: 'cast',
              component: {
                name: 'castvideos.CastButton',
              },
            },
            ...(state === 'connected'
              ? [
                  {
                    id: 'queue',
                    icon: require('../assets/playlist.png'),
                  },
                ]
              : []),
          ],
        },
      })
    }
    GoogleCast.getCastState().then(setConnected)
    this.castStateListener = GoogleCast.onCastStateChanged(setConnected)

    GoogleCast.showIntroductoryOverlay()

    Video.findAll()
      .then(videos => this.setState({ videos }))
      .catch(console.error)

    GoogleCast.getRoutes()
      .then( routes => this.setState({ routes }))
      .catch(console.error);
  }

  componentWillUnmount() {
    this.castStateListener.remove()
  }

  startCasting() {
    //GoogleCast.getRoutes().then( routes => {console.log(routes);});
    //GoogleCast.showExpandedControls();

    let video = new Video({
      contentId: "1",
      title: 'Big Buck Bunny',
      subtitle: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
      studio: 'Blender Foundation',
      duration: 596,
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/BigBuckBunny.m3u8',
      imageUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
      posterUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
    })

    //let video = this.state.videos[0];
   
    RemoteMediaClient.getCurrent()
      .loadMedia(video.toMediaInfo(), { autoplay: true })
      .then(console.log)
      .catch(console.warn)

    //GoogleCast.showExpandedControls()
   
  }

  getMediaInfo(){
    RemoteMediaClient.getCurrent().getMediaInfo().then(console.log);
  }

  selectRoute(id: string) {
    GoogleCast.selectRoute(id).then( success => {console.log(success);});
  }

  render() {
    return (
      
      <View style={{ width: '100%', alignSelf: 'stretch' }}>
        <Button
        title="Start casting"
        onPress={() => this.startCasting() }/>
           <Button
        title="Get media info"
        onPress={() => this.getMediaInfo() }/>
        <FlatList
         data={this.state.routes}
         keyExtractor={(item, index) => item.id}
         renderItem={this.renderVideo}
         style={{ width: '100%', alignSelf: 'stretch' }}
       />
      </View>
    )
  }
  renderVideo = ({ item, index }: { item: {id: string, name: string}; index: number }) => {
    const {id, name} = item;
    return (
      <TouchableOpacity
        key={id}
        onPress={() => this.selectRoute(id)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}
      >
      <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
          <Text>{name}</Text>
          <Text style={{ color: 'gray' }}>{id}</Text>
      </View>

        {/* {this.state.connected && (
          <TouchableOpacity
            onPress={() => {
              this.props.showActionSheetWithOptions(
                {
                  options: ['Play Now', 'Play Next', 'Add to Queue', 'Cancel'],
                  cancelButtonIndex: 3,
                },
                async buttonIndex => {
                  const client = RemoteMediaClient.getCurrent()

                  if (buttonIndex === 0) {
                    this.cast(video)
                  } else if (buttonIndex === 1) {
                    const status = await client.getMediaStatus()
                    client
                      .queueInsertItem(
                        {
                          mediaInfo: item.toMediaInfo(),
                        },
                        status && status.queueItems.length > 2
                          ? status.queueItems[1].itemId
                          : null
                      )
                      .catch(console.warn)
                  } else if (buttonIndex === 2) {
                    client
                      .queueInsertItem({
                        mediaInfo: item.toMediaInfo(),
                      })
                      .catch(console.warn)
                  }
                }
              )
            }} */}
          {/* >
            <Image source={require('../assets/overflow.png')} />
          </TouchableOpacity>
        )} */}
      </TouchableOpacity>
    )
  }

  cast = (video: Video) => {
    RemoteMediaClient.getCurrent()
      .loadMedia(video.toMediaInfo(), { autoplay: true })
      .then(console.log)
      .catch(console.warn)

    GoogleCast.showExpandedControls()
  }

  navigateToVideo = (video: Video, elementId: string) => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'castvideos.Video',
        passProps: {
          video,
        },
        options: {
          // customTransition: {
          //   animations: [
          //     {
          //       type: 'sharedElement',
          //       fromId: elementId,
          //       toId: 'videoPreview',
          //       startDelay: 0,
          //       springVelocity: 0.2,
          //       duration: 0.5,
          //     },
          //   ],
          //   duration: 0.8,
          // },
          topBar: {
            title: {
              text: video.title,
            },
          },
        },
      },
    })
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'queue') {
      Navigation.push(this.props.componentId, {
        component: { name: 'castvideos.Queue' },
      })
    }
  }
}

export default HomeScreen
