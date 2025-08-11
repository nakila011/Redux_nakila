import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Appbar,
  Avatar,
  Banner,
  Button,
  Card,
  Divider,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";


const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, showBanner: false }, 
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    showBanner(state) {
      state.showBanner = true;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
  },
});

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return { payload: { id: nanoid(), title, done: false, createdAt: Date.now() } };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
  },
});

const { toggleDarkMode, showBanner, dismissBanner } = uiSlice.actions;
const { addTodo, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    todos: todosSlice.reducer,
  },
});



export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(() => (darkMode ? MD3DarkTheme : MD3LightTheme), [darkMode]);
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}



function AppScaffold() {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const showBanner = useSelector((s) => s.ui.showBanner);



  /********************
  Bannner nga component
 ********************/


  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content title="Expo + Redux Demo" subtitle={`Running on ${Device.osName ?? "Unknown OS"}`} />
        <DarkModeSwitch />
      </Appbar.Header>
  
  

      {showBanner && (
  <Banner
    visible
    actions={[
      {
        label: "Got it",
        onPress: () => dispatch(dismissBanner()),
      },
    ]}
    icon={({ size }) => <Avatar.Icon size={size} icon="information-outline" color="white" />}
  >
    A New Task has been added to the List! You can manage your tasks below.
  </Banner>
)}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[isTablet && styles.contentTablet, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
    <View style={[styles.column, isTablet && styles.columnTablet]}>
        
          <TodosCard />
          <DoneCard />
       
        </View>
      </ScrollView>


      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content title="Footer" subtitle={Platform.select({ ios: "iOS", android: "Android", default: "Web" })} />
      </Appbar>
   
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      <Text accessibilityRole="header" style={{ marginRight: 8 }}>
        {darkMode ? "Dark" : "Light"}
      </Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        accessibilityLabel="Toggle dark mode"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}





/********************
  Function sa TodosCard 
 ********************/




function TodosCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items.filter((item) => !item.done));
  const [title, setTitle] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  const addTask = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    dispatch(showBanner());
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todos (Pending tasks)"
        subtitle="Responsive FlatList"
        left={(props) => <Avatar.Icon {...props} icon="checkbox-blank-circle-outline" />}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <Button mode="contained" onPress={addTask}>
            Add
          </Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        <FlatList
          data={items}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="circle-outline" />}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>Done</Button>
                <Button
                    onPress={() => dispatch(removeTodo(item.id))}
                    textColor="rgba(255, 255, 255, 1)"
                    style={{ backgroundColor: 'red' }} > Remove </Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={<Text accessibilityLabel="Empty list">No todos yet. Add one above.</Text>}
        />
        {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>
            Clear All
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}






/********************
  Function sa Done nga Card
 ********************/


function DoneCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items.filter((item) => item.done));
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Done (Completed tasks)"
        subtitle="Responsive FlatList"
        left={(props) => <Avatar.Icon {...props} icon="check-circle" />}
      />
      <Card.Content>
        <FlatList
          data={items}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="check" />}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>Undo</Button>
                <Button
                    onPress={() => dispatch(removeTodo(item.id))}
                    textColor="rgba(255, 255, 255, 1)"
                    style={{ backgroundColor: 'red' }} > Remove </Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={<Text accessibilityLabel="Empty list">No completed tasks yet.</Text>}
        />
         {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>
            Clear All
          </Button>
        )}
       
      </Card.Content>
    </Card>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  containerTablet: { paddingHorizontal: 12 },
  content: { flex: 1, padding: 12 },
  contentTablet: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  columnTablet: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },
});
