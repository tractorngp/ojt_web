import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { UserContext } from '../App';
import { makeStyles, Backdrop, CircularProgress } from '@material-ui/core';
import * as firebase from 'firebase';
import 'firebase/auth';
import 'firebase/firestore';
import * as bcrypt from 'bcryptjs';
import tractorPg from './../assets/images/tractor_pg.png';
import mahindraRise from './../assets/images/mahindra_rise.png';
import { IoMdArrowForward } from 'react-icons/io';

const useStyles = makeStyles((theme) => ({

    loginBox: {
        //marginTop: '5vh',
        padding: '10vh'
    },
    inputStyle: {
        display: 'flex',
        margin: '1rem',
        width: '50%',
        marginLeft: '25%',
        [theme.breakpoints.up('xs')]: {
            width: '100%',
            marginLeft: '0'
        },
        [theme.breakpoints.up('md')]: {
            marginLeft: '35%',
            width: '30%',
        }
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
    loginBtn: {
        padding: '15px 50px 15px 50px'
    },
    headerImg: {
        [theme.breakpoints.up('xs')]: {
            width: '125px',
            height: '100%'
        },
        [theme.breakpoints.up('md')]: {
            width: '200px',
            height: '100%'
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

    const handleLogin = _ => {
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
                                window.localStorage.setItem('ojtUserData', JSON.stringify(userData));
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
            <Backdrop className={classes.backdrop} open={loading}>
                <CircularProgress style={{ 'color': 'white' }} size={25} />
                    &nbsp;<p style={{ color: 'white' }}>Logging In...</p>
            </Backdrop>
            <form method={'POST'} ref={formRef}>
                <div className={classes.headerImages}>
                    <img className={classes.headerImg} src={tractorPg} alt={''} />
                    <img className={classes.headerImg} width={300} height={100} src={mahindraRise} alt={'Mahindra Rise'} />
                </div>
                <br />
                <TextField required className={classes.inputStyle} type={'text'} name={'tokenId'} id="standard-basic" label="Enter Token ID" />
                <br /><br />
                <TextField required name={'password'} className={classes.inputStyle} type={'password'} id="standard-basic" label="Enter Password" />
                <br /><br />
                <Button className={classes.loginBtn} onClick={handleLogin} disabled={loading} type={'submit'} name={'loginSubmit'} variant="contained" color="primary">
                    Sign In &nbsp; <IoMdArrowForward size={20} />
                </Button>
            </form>
        </div>
    );

};

export default Login;