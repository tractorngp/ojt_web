import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { IoMdMenu } from 'react-icons/io'
const useStyles = makeStyles({
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
  admin_home:{
    margin: '1vh'
  }
});

const bodyDivs = {
    USERS: 'users',
    CREATE_OJT: 'create_ojt',
    GROUPS: 'groups',
    PENDING_OJTS: 'pending_ojts'
};

const drawerSegments = [
    { name:'Users',id:bodyDivs.USERS },
    { name:'Create OJT',id:bodyDivs.CREATE_OJT },
    { name:'Groups',id:bodyDivs.GROUPS },
    { name:'Pending OJTs',id:bodyDivs.PENDING_OJTS }
]

export default function AdminDashboard(props) {
  const classes = useStyles();
  const [state, setState] = React.useState({
    left: false
  });
  const [ bodyCase, switchBodyCase ] = React.useState(bodyDivs.USERS);

  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const BodyDiv = _ =>{
      switch (bodyCase) {
          case bodyDivs.CREATE_OJT:
              return (
                  <p>Create OJT</p>
              );
          case bodyDivs.USERS:
              return (
                  <p>Users</p>
              );
          case bodyDivs.GROUPS:
              return (
                  <p>Groups</p>
              );
          case bodyDivs.PENDING_OJTS:
              return (
                  <p>Pending OJTs</p>
              );
        default:
            return ('');
      }
  }

  const list = (anchor) => (
    <div
      className={clsx(classes.list, {
        [classes.fullList]: anchor === 'top' || anchor === 'bottom',
      })}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
        {drawerSegments.map((text, index) => (
          <ListItem button key={text.name} onClick={()=>{switchBodyCase(text.id)}}>
            <ListItemText primary={text.name} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <div className="admin_home" style={{'padding':'20px'}}>
        <Button style={{'display':'inline-flex','float':'right'}}>Logout</Button>
        <Button style={{'display':'inline-flex','float':'left'}} variant="text">
        <IoMdMenu size={30} onClick={toggleDrawer('left', true)} />
        </Button>
        <h3> OJT Web | Admin Dashboard </h3>
        <React.Fragment>
          <Drawer anchor={'left'} open={state['left']} onClose={toggleDrawer('left', false)}>
            {list('left')}
          </Drawer>
        </React.Fragment>

        {/* selective divs */}
        <div style={{marginTop:'7vh'}}>
        <BodyDiv />
        </div>
    </div>
  );
}