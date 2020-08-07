import React from 'react';
import TextField from '@material-ui/core/TextField';
import { UserContext } from '../App';
import { makeStyles } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import * as bcrypt from 'bcryptjs';
import tractorPg from './../assets/images/tractor_pg.png';
import mahindraRise from './../assets/images/mahindra_rise.png';
import { IoMdArrowForward } from 'react-icons/io';
import { setStorageItem } from '../utils/sessionStorageService';
import { Button, Row, Col, Alert } from 'react-bootstrap';
import { BackDropComponent } from '../components/pageLoaderComponent';

const useStyles = makeStyles((theme) => ({

    loginBox: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        verticalAlign: 'middle',
        width: '100%',
        height: '100%',
        paddingTop: '10%'
    },
    inputStyle: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginTop: '1rem',
        marginBottom: '1rem',
        width: '100%',
        [theme.breakpoints.up('xs')]: {
            width: '75%',
            marginLeft: '0'
        },
        [theme.breakpoints.up('md')]: {
            width: '100%',
        }
    },
    loginBtn: {
        padding: '15px 50px 15px 50px'
    },
    headerImg: {
        // [theme.breakpoints.up('xs')]: {
        //     width: '125px',
        //     height: '100%'
        // },
        // [theme.breakpoints.up('md')]: {
        //     width: '200px',
        //     height: '100%'
        // }
    },
    headerText: {
        [theme.breakpoints.up('xs')]: {
            display:"flex", flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'
        },
        [theme.breakpoints.up('md')]: {
            display:"flex", flexDirection: 'column', justifyContent: 'center', alignItems: 'start', width: '100%', height: '100%'
        }
    }

}));

const validateField = value => {
    if (value !== null && value !== undefined && value !== '') return true;

    return false;
}

const Login = props => {

    const classes = useStyles();
    const formRef = React.useRef(null);
    const { dispatch } = React.useContext(UserContext);
    const [loading, setLoading] = React.useState(false);
    const db = firebase.firestore();

    const handleLogin = x => {
        x.preventDefault();
        setLoading(true);
        const tokenId = formRef.current['tokenId'].value;
        const password = formRef.current['password'].value;
        if (validateField(tokenId) && validateField(password)) {
            db.collection('users').doc(String(tokenId))
                .get().then(val => {
                    const pwCheck = bcrypt.compareSync(password, val.data().hpw);
                    if (pwCheck) {
                        const ud = val.data();
                        const userData = {
                            role: ud.role,
                            tokenId: ud.tokenId,
                            isLoggedIn: true,
                            name: ud.name,
                            type: 'ALL'
                        };
                        if (val.data().active === false) {
                            setLoading(false);
                            alert('Your account is INACTIVE, contact Admin to change status')
                        } else {
                            if (val.data().role !== 'admin') {
                                setLoading(false);
                                alert('Access Denied, only for Admins');
                            } else {
                                setStorageItem('ojtUserData',userData);
                                dispatch(userData);

                            }
                        }
                    } else {
                        setLoading(false);
                        alert('Incorrect Password');
                    }
                }).catch(e => {
                    console.error(e);
                    setLoading(false); alert('Invalid ID');
                });
        } else {
            setLoading(false);
            alert('Entered Invalid ID / Password!')
        }
    };

    return (
        <div id="fc-login" className={classes.loginBox}>
            <BackDropComponent showBackdrop={loading} maskingText={'Logging In...'} />
            <form method={'POST'} ref={formRef}>
                <Row>
                    <Col md={4}>
                        <div className={classes.headerImages}>
                            <img className={classes.headerImg} width={100} height={100} src={tractorPg} alt={''} />
                            <img className={classes.headerImg} width={100} height={40} src={mahindraRise} alt={'Mahindra Rise'} />
                        </div>
                    </Col>
                    <Col md={8}>
                        <div className={classes.headerText}>
                            <h3 style={{ margin: '0', color: 'dark-grey', fontWeight: '900', fontFamily:'sans-serif'}}>OJT App Login</h3>
                        </div>
                    </Col>
                </Row>
                <br />
                <Row style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '2%', margin: '0'}}>
                    <Col style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <TextField required className={classes.inputStyle} type={'text'} name={'tokenId'} id="standard-basic" label="Enter Token ID" />
                        <br /><br />
                        <TextField required name={'password'} className={classes.inputStyle} type={'password'} id="standard-basic" label="Enter Password" />
                        <br /><br />
                    </Col>
                </Row>
                
                <Button className={classes.loginBtn} onClick={handleLogin} disabled={loading} type={'submit'} name={'loginSubmit'} variant="danger">
                    Sign In &nbsp; <IoMdArrowForward size={20} />
                </Button>
            </form>
        </div>
    );

};

export default Login;