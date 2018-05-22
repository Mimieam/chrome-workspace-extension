import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';

import Button from 'material-ui/Button';
import indigo from 'material-ui/colors/indigo';
import pink from 'material-ui/colors/pink';
import red from 'material-ui/colors/red';
import withStyles from 'material-ui/styles/withStyles';

import Icon from 'material-ui/Icon';
import AddToPhotosIcon from 'material-ui-icons/AddToPhotos';
import IconButton from 'material-ui/IconButton';
import Modal from 'material-ui/Modal/Modal';
import Typography from 'material-ui/Typography/Typography';
import StyledModal from './styledModal'

import './muscle.css'
import '../index.css';
import Workspace from './components/Workspace'
import { saveCurrentWindow, WSM } from '../background/WorkspaceManager';
import { GCWindows , GCTabs } from '../background/helpers';

import theme from './theme'
import WspSnackbar from './components/Snackbar.wsp';

export const styles = {
  root: {
    padding:'5px',
    width: 530,
    height: 500,
    background: '#363537',
    color: '#fff',
    // overflow: 'hidden'
  },
  customButton: {
     background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
     borderRadius: 3,
     border: 0,
     color: 'white',
     height: 48,
     padding: '0 30px',
     boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .30)',
  }
  ,
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  buttonBadge: {
      margin: '20px',
      padding: `10px ${theme.spacing.unit * 20}px`,
  }
};

class Popup extends Component {

  constructor (props) {
    super(props)
    this.state = {
      workspaces: [],
      wID: 'None',
      activeWS: null // active clicked ws 
    }
  }

  async componentWillMount() {
    const allWS = await WSM.getAllWorkSpace()
    const window = await GCWindows.getCurrent(true)
    console.log(allWS)
    this.setState({
      workspaces: allWS,
      wID: window.id
    })
  }

  componentDidMount() {
    console.log(this)
  }

  onClick = () => {
    this.modal.handleOpen() // do stuff
  }

  onWorkspaceClick = (wsObj) => {
    console.log('a workspace was clicked', wsObj)
    this.snack.handleClick({name: wsObj})
  }
  
  async createNewWS(name) {
    await saveCurrentWindow(name)
    const allWS = await WSM.getAllWorkSpace()
    const window = await GCWindows.getCurrent(true)
    console.log(allWS)
    await this.setState({
      workspaces: allWS,
      wID: window.id
    })
    console.log( 'done creating stuff')
  }
  async openWS(name) {
    const ws = await WSM.openAWorkSpace(name)
    console.log('attempting to open ws :', name, ws)
    const tabsURLs = ws.tabs.map(t => t.url)
    const newWindow = await GCWindows.createWindow(tabsURLs, true) 
    // console.log('new Window created with Id: ', newWindow)
  }

  async updateWS(name) {
    await saveCurrentWindow(name)
    // await WSM.updateWorkSpace(name), 
  }

  async deleteWS(name) {
    await WSM.removeWorkSpace(name)
    await this.setState({
      workspaces: this.state.workspaces.filter(item => item.name !== name)
    })
    // console.log('new Window created with Id: ', newWindow)
  }

  render() {
    const { classes } = this.props;

    return (
      <MuiThemeProvider theme={ theme }>
        <div className='flex-container top column' style={ styles.root }>  
          <div className={ 'flex-item row fixed-header' }>
            <div className={ 'flex-item top center' }>
              <Typography variant="title" gutterBottom>
                [ WorkSpace { this.state.wID } ]
              </Typography>
              
            </div>  
            <div className={ 'flex-item top right' }>
              <IconButton color="primary" onClick={ this.onClick }>
                <AddToPhotosIcon/> 
              </IconButton>
            </div>  
          </div>  

          <div className={ 'flex-item column' }>
            <div  className="flex-item row wrap"> 
            { console.log(this.state.workspaces) }
              {
                this.state.workspaces.map((ws) => {
                  return <Workspace
                    name={ ws.name }
                    urls={ ws.tabs }
                    onWorkspaceClick={(e)=> this.onWorkspaceClick(e)}
                  />
                })
              }  
            </div>
          </div>

          </div>  
          <StyledModal
            callback={this.createNewWS.bind(this)}  
            onRef={ ref => (this.modal = ref) }
        />
        <WspSnackbar
          onOpenHandler={this.openWS.bind(this)}
          onUpdateHandler={this.updateWS.bind(this)}
          onDeleteHandler={this.deleteWS.bind(this)}
          onRef={ ref => (this.snack = ref) }
        />
      </MuiThemeProvider>  
    )
  }
}

export default Popup

const StyledPopup = withStyles(styles)(Popup);
ReactDOM.render(<StyledPopup />, document.getElementById('root'));
