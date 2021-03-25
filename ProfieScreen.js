import React, { useState, useEffect } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth, { firebase } from "@react-native-firebase/auth";
// import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { ActionSheet } from "react-native-cross-actionsheet";
import Video from "react-native-video";
import storage from "@react-native-firebase/storage";

//ScreenDimensions
const windowWidth = Dimensions.get("screen").width;
const screenheight = Dimensions.get("screen").height;

//Data Variables

const ProfileScreen = ({ navigation }) => {
  //States
  const [UserName, setUserName] = useState("");
  const [Email, setEmail] = useState("");
  const [PhoneNumber, setPhoneNumber] = useState("");
  const [filePath, setFilePath] = useState({});
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transferred, setTransferred] = useState(0);

  useEffect(() => {
    fetchUser();
  }, []);

  //Input Field Function
  function UserNameN(names) {
    setUserName(names);
  }

  function Emailfn(_email) {
    setEmail(_email);
  }
  function PhoneNumberfn(_email) {
    setEmail(_email);
  }

  //Camera Permissions
  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission",
          }
        );
        // If CAMERA Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };


  //Ggetting Users Permission
  const requestExternalWritePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "External Storage Write Permission",
            message: "App needs write permission",
          }
        );
        // If WRITE_EXTERNAL_STORAGE Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        alert("Write permission err", err);
      }
      return false;
    } else return true;
  };

  //Capture Image
  const captureImage = async (type) => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,

      saveToPhotos: true,
    };
    let isCameraPermitted = await requestCameraPermission();
    let isStoragePermitted = await requestExternalWritePermission();
    if (isCameraPermitted && isStoragePermitted) {
      launchCamera(options, (response) => {
        console.log("Response = ", response);

        if (response.didCancel) {
          alert("User cancelled camera picker");
          return;
        } else if (response.errorCode == "camera_unavailable") {
          alert("Camera not available on device");
          return;
        } else if (response.errorCode == "permission") {
          alert("Permission not satisfied");
          return;
        } else if (response.errorCode == "others") {
          alert(response.errorMessage);
          return;
        }

        console.log("fileName -> ", response.fileName);
        setFilePath(response);
      });
    }
  };


  //Select Image from Gallery
  const selectImage = () => {
    const options = {
      maxWidth: 2000,
      maxHeight: 2000,
      storageOptions: {
        skipBackup: true,
        path: "images",
      },
    };
    launchImageLibrary(options, (response) => {
      console.log("Response = ", response);

      if (response.didCancel) {
        alert("User cancelled camera picker");
        return;
      } else if (response.errorCode == "camera_unavailable") {
        alert("Camera not available on device");
        return;
      } else if (response.errorCode == "permission") {
        alert("Permission not satisfied");
        return;
      } else if (response.errorCode == "others") {
        alert(response.errorMessage);
        return;
      }
      setImage(response);
    });
  };


  //Upload Image to Firebase
  const uploadImage = async () => {
    const { uri } = image;
    console.log(uri);
    const uploadUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const user = firebase.auth().currentUser;
    setUploading(true);
    setTransferred(0);
    var storageRef = firebase
      .storage()
      .ref("users/" + user.uid + "/" + "pic_" + user.uid + ".png");
    var task = storageRef.putFile(uri);
    try {
      await task;
      storageRef.getDownloadURL().then(function (url) {
        console.log(url);
        Alert.alert("Uploaded Suceessfunlly");
      });
    } catch (e) {
      console.error(e);
    }
    setImage(url);
  };

  //ActionList for Image Picking Options
  function ActionList() {
    return ActionSheet.options({
      options: [
        {
          text: " Open Camera ",
          onPress: () => captureImage("photo"),
        },
        {
          text: "Choose Image",
          onPress: () => selectImage(),
        },
      ],
      cancel: { onPress: () => console.log("cancel") },
    });
  }

  ///Fetching CouponsFunctions
  function fetchUser() {
    const user = firebase.auth().currentUser;
    if (!user) {
      return;
    }
    firestore()
      .collection("Users")
      .where("uid", "==", user.uid)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          console.log(data);
          setUserName(data.name);
          setEmail(data.email);
          setPhoneNumber(data.phoneNumber);
        });
      });
  }

  return (
    <>
      <StatusBar hidden />
           <KeyboardAvoidingView behavior={"padding"} style={styles.container}>
        <ScrollView
          style={{ paddingVertical: 2 }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.HelpingContainer}></View>
          <View style={styles.Conatiner}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.inner}>
                <View
                  style={{
                    alignItems: "center",
                  }}
                >
                  <View style={styles.imageContainer}>
                    {image !== null ? (
                      <>
                        <View>
                          <TouchableOpacity onPress={() => ActionList()}>
                            <Image
                              resizeMode={"contain"}
                              source={{ uri: image.uri }}
                              style={styles.imageStyle}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={uploadImage}
                          >
                            <Text style={styles.buttonText}>Upload image</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => ActionList()}>
                        <View
                          style={{
                            borderColor: "green",
                            borderWidth: 2,
                            width: 140,
                            height: 140,
                            borderRadius: 100,
                          }}
                        >
                          <Image
                            source={require("../../Assets/usericon.png")}
                            style={styles.imageStyle}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View>
                  <Text style={styles.header}>Name</Text>
                </View>
                <TextInput
                  underlineColorAndroid={"transparent"}
                  placeholder=" Enter your Name"
                  style={styles.input}
                  value={UserName}
                  onChangeText={(names) => UserNameN(names)}
                />
                <View>
                  <Text style={styles.header}>Email Address </Text>
                </View>
                <TextInput
                  underlineColorAndroid={"transparent"}
                  placeholder="Enter your email "
                  style={styles.input}
                  value={Email}
                  onChangeText={(_email) => {
                    Emailfn(_email);
                  }}
                />
                <View>
                  <Text style={styles.header}>Phone Number</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={PhoneNumber}
                  onChangeText={(_phoneNumber) => {
                    PhoneNumberfn(_phoneNumber);
                  }}
                />

                {/* <View style={styles.btnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditProfile", {
                        ImagePath: filePath.uri,
                      })
                    }
                  >
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={uploadImage}
                    >
                      <Text style={styles.buttonText}>Upload image</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View> */}

                <View style={{ flex: 1 }} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    height: screenheight,
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "stretch",
    bottom: 0,
    right: 0,
  },
  Conatiner: {
    margin: 0,
    borderTopRightRadius: 30,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    bottom: 0,
    width: "100%",
    height: screenheight,
    paddingHorizontal: 24,
  },
  HelpingContainer: { height: 160, backgroundColor: "transparent" },
  inner: {
    padding: 24,
    flex: 1,
  },
  header: {
    fontSize: 16,
    marginBottom: 28,
  },
  input: {
    height: 10,
    borderColor: "#000000",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  selectButton: {
    borderRadius: 5,
    width: 150,
    height: 50,
    backgroundColor: "#8ac6d1",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    paddingVertical: 6,

    borderRadius: 5,
    backgroundColor: "green",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  imageContainer: {
    marginTop: 30,
    marginBottom: 50,
    alignItems: "center",
  },
  progressBarContainer: {
    marginTop: 20,
  },
  imageBox: {
    width: 300,
    height: 300,
  },
  btnContainer: {
    backgroundColor: "white",
    marginTop: 12,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
  },
  textStyle: {
    padding: 10,
    color: "black",
    textAlign: "center",
  },
  buttonStyle: {
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    padding: 5,
    marginVertical: 10,
    width: 250,
  },
  imageStyle: {
    marginTop: 22,
    width: 80,
    height: 80,
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
  },
});

export default ProfileScreen;
