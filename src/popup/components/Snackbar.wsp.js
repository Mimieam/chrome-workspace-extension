import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'material-ui/styles/withStyles';
import Button from 'material-ui/Button';
import Snackbar from 'material-ui/Snackbar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';

const styles = theme => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
});



class SimpleSnackbar extends React.Component {
  state = {
    open: false,
    activeWorkspace: {},
  };

  componentDidMount() {
    this.props.onRef(this)
  }
  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  handleClick = (wsObj) => {
    this.setState({
      open: true,
      activeWorkspace: wsObj || {}
    });
  };

  handleOpen = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };

  update = () => {
    console.log('Updating Working - ', this.state.activeWorkspace)
  }

  delete = () => {
    console.log('Deleting Working - ', this.state.activeWorkspace)
  }

  snacksOptions = (classes) => {
    return [
      <Button key="open" color="secondary" size="small" onClick={this.handleOpen}>
        OPEN
      </Button>,
      <Button key="update" color="secondary" size="small" onClick={this.update}>
        UPDATE
      </Button>,
      <Button key="delete" color="secondary" size="small" onClick={this.delete}>
        DELETE
      </Button>,
      <IconButton
        key="close"
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={this.handleOpen}
      >
        <CloseIcon />
      </IconButton>,
    ]
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        {/* <Button onClick={this.handleClick}>Open simple snackbar</Button> */}
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.open}
          autoHideDuration={6000}
          onClose={this.handleOpen}
          SnackbarContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">{this.state.activeWorkspace.name}</span>}
          action={this.snacksOptions(classes)}
        />
      </div>
    );
  }
}

SimpleSnackbar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleSnackbar);
