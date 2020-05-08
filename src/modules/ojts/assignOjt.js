import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { Checkbox, CircularProgress } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

const AssignOJT = ({ assignToGroups, assignToGroupsDispatch }) => {

    const [ groups, setGroups ] = React.useState([]);
    const [ loading, setLoading ] = React.useState(true);
    const db = firebase.firestore();

    const fetchAllGroups = _ => {

        setLoading(true);
        db.collection('groups').where('active','==',true)
          .onSnapshot(groupsSnapshot => {
            const gList = groupsSnapshot.docs.map(snapShot => snapShot.data());
            setGroups(gList);
            setLoading(false);
          }, error => {
            setLoading(false);
            alert('DB Error');
            console.error(error);
          });

      };

    const updateSelectedGroups = (val,group) => {
        if(val === true){
            assignToGroups.push(group);
            assignToGroupsDispatch(assignToGroups);
        }else{
            const removingIdIndex = assignToGroups.lastIndexOf(group);
            assignToGroups.splice(removingIdIndex, 1);
            assignToGroupsDispatch(assignToGroups);
        }
        console.log(assignToGroups);
    };

    React.useEffect( _ => {
        fetchAllGroups();
    }, []);

    return (
        <ListGroup>
            {
                loading === true ? <span><CircularProgress size={20} /> <p>Fetching Groups... </p> </span> :
                <span>{groups.length === 0 ? 'No Groups' :
                groups.map(group => (
                    <ListGroup.Item key={group.group_id}>
                        <p> <Checkbox
                        color={'primary'}
                        defaultChecked={false} 
                        onChange={
                            (val)=>updateSelectedGroups(val.target.checked,group)
                        }
                        /> {group.name} <Badge variant={'info'}> {group.group_members.length} Members </Badge> </p>
                    </ListGroup.Item>
                ))}</span>
            }
        </ListGroup>
    );

};

export default AssignOJT;
