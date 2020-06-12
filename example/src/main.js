/* @flow */

import React from 'react'
import {
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  Platform,
  ToolbarAndroid,
  TouchableOpacity,
} from 'react-native'
import styles from './main.style'
import GoogleCast, { CastButton } from 'react-native-google-cast'
import ActionButton from 'react-native-action-button'

// Establishing connection to Chromecast
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTING, () => {
  /* callback */
})

// Connection established
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => {
  console.log("GoogleCast.SESSION_STARTED");
})

// Connection failed
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_START_FAILED, error => {
  console.error(error)
})

// Connection suspended (your application went to background or disconnected)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_SUSPENDED, () => {
  /* callback */
})

// Attempting to reconnect
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMING, () => {
  /* callback */
})

// Reconnected
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMED, () => {
  /* callback */
})

// Disconnecting
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDING, () => {
  /* callback */
})

// Disconnected (error provides explanation if ended forcefully)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, error => {
  /* callback */
})

GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_STATUS_UPDATED,
  ({ mediaStatus }) => { console.log(mediaStatus)},
)

class Main extends React.Component {
  constructor(props) {
    super(props)

    this.cast = this.cast.bind(this)
    this.renderVideo = this.renderVideo.bind(this)
    this.subtitlesEnabled = false

    this.state = {
      videos: [],
      mediaMetadata: { metadata: { title : "None" }},
    }
  }

  componentDidMount() {
    this.registerListeners()

    GoogleCast.getCastState().then(console.log)
    // GoogleCast.showIntroductoryOverlay();

    const CAST_VIDEOS_URL =
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'
    fetch(CAST_VIDEOS_URL)
      .then(response => response.json())
      .then(data => {
        const mp4Url = data.categories[0].mp4
        const imagesUrl = data.categories[0].images

        this.setState({
          videos: data.categories[0].videos.map(video => ({
            title: video.title,
            subtitle: video.subtitle,
            studio: video.studio,
            duration: video.duration,
            mediaUrl: mp4Url + video.sources[2].url,
            imageUrl: imagesUrl + video['image-480x270'],
            posterUrl: imagesUrl + video['image-780x1200'],
          })),
        })
      })
      .catch(console.error)
  }

  cast(video) {
    GoogleCast.getCastDevice().then(console.log)
    GoogleCast.castMedia(video)
    this.sendMessage()
  }

  openCustomDialog(){
    GoogleCast.getRoutes().then(console.log)
  }

  getMediaInfo(){
    GoogleCast.getMediaInfo().then( media => { 
      this.setState({ mediaMetadata: JSON.parse(media) });
      console.log(JSON.parse(media));
    });
  }

  onActionSelected = position => {
    switch (position) {
      case 0:
        GoogleCast.play()
        break
      case 1:
        GoogleCast.pause()
        break
      case 2:
        GoogleCast.stop()
        break
      case 3:
        this.subtitlesEnabled = !this.subtitlesEnabled
        GoogleCast.toggleSubtitles(this.subtitlesEnabled)
        break
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {Platform.OS === 'android' ? (
          <ToolbarAndroid
            contentInsetStart={4}
            actions={[
              { title: 'Play', show: 'always' },
              { title: 'Pause', show: 'always' },
              { title: 'Stop', show: 'always' },
              { title: 'CC (en)', show: 'always' },
            ]}
            onActionSelected={this.onActionSelected}
            style={styles.toolbarAndroid}
          >
            <CastButton style={styles.castButtonAndroid} />
          </ToolbarAndroid>
        ) : (
          <View style={styles.toolbarIOS}>
            <Button
              title="Stop"
              onPress={() => GoogleCast.endSession()}
              style={styles.stopButton}
            />
            <CastButton style={styles.castButtonIOS} />
          </View>
        )}
         <Button
            title="Show custom dialog"
            onPress={() => this.openCustomDialog() }/>

        <Button
            title="Set volume 50%"
            onPress={() => GoogleCast.setVolume(0.5) }/>
        <Button
            title="SKIP"
            onPress={() => GoogleCast.skip(1000) }/>
        <Button
            title="Show extended control"
            onPress={() =>  GoogleCast.launchExpandedControls() }/>
           <Button
            title="Get media info"
            onPress={() => this.getMediaInfo() }/>
             <ActionButton
                buttonColor="rgba(231,76,60,1)"
                onPress={() => this.openCustomDialog() }
                renderIcon={() => (<CastButton tintColor='white'/>)}
          />
          <View style={{ width: '100%', heigh: '30' , backgroundColor: 'white'}}>
          <Text>{ this.state.mediaMetadata.metadata.title }</Text>
          </View>
       
        <FlatList
          data={this.state.videos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={this.renderVideo}
          style={{ width: '100%', alignSelf: 'stretch' }}
        />
       
      </View>
    )
  }

  renderVideo({ item }) {
    const video = item

    return (
      <TouchableOpacity
        key={video.title}
        onPress={() => this.cast(video)}
        style={{ flexDirection: 'row', padding: 10 }}
      >
        <Image
          source={{ uri: video.imageUrl }}
          style={{ width: 160, height: 90 }}
        />
        <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
          <Text style={{}}>{video.title}</Text>
          <Text style={{ color: 'gray' }}>{video.studio}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  registerListeners() {
    const events = `
      SESSION_STARTING SESSION_STARTED SESSION_START_FAILED SESSION_SUSPENDED
      SESSION_RESUMING SESSION_RESUMED SESSION_ENDING SESSION_ENDED

      MEDIA_STATUS_UPDATED MEDIA_PLAYBACK_STARTED MEDIA_PLAYBACK_ENDED MEDIA_PROGRESS_UPDATED

      CHANNEL_CONNECTED CHANNEL_DISCONNECTED CHANNEL_MESSAGE_RECEIVED
    `
      .trim()
      .split(/\s+/)
    console.log(events)

    events.forEach(event => {
      GoogleCast.EventEmitter.addListener(GoogleCast[event], function() {
        console.log(event, arguments)
      })
    })
  }

  sendMessage() {
    const channel = 'urn:x-cast:com.reactnative.googlecast.example'

    GoogleCast.initChannel(channel).then(() => {
      GoogleCast.sendMessage(channel, JSON.stringify({ message: 'Hello' }))
    })
  }
}

export default Main
