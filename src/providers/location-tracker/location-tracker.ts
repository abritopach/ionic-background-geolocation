import { Injectable, NgZone } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';

import {
  BackgroundGeolocation,
  BackgroundGeolocationConfig,
  BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation';

import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';

/*
  Generated class for the LocationTrackerProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationTrackerProvider {

  public logs: string[] = [];
  public watch: any;   
  public lat: number = 0;
  public lng: number = 0;

  constructor(public zone: NgZone, public backgroundGeolocation: BackgroundGeolocation, public geolocation: Geolocation,
    private platform: Platform, private alertCtrl: AlertController) {
    console.log('Hello LocationTrackerProvider Provider');
  }

  startBackgroundGeolocation() {
    
     // Background Tracking

     /*
     let config = {
      desiredAccuracy: 0,
      stationaryRadius: 20,
      distanceFilter: 10,
      debug: true,
      interval: 2000
    };
    */
    
     let config: BackgroundGeolocationConfig = {
      desiredAccuracy: 0, // Valores posibles [0, 10, 100, 1000]. Cuánto menor es el valor la precisión en metros obtenida por el plugin es mejor.
      stationaryRadius: 20, // Valor en un radio (en metros) donde el plugin se activará o enviará una respuesta.
      distanceFilter: 10, // Valor en metros (distancia) donde el plugin se activará o enviará una respuesta.
      debug: true, // Información detallada acerca de la respuesta. Emite un sonido cada vez que detecta un nuevo registro.
      interval: 2000
      //stopOnTerminate: false, // Si el valor es true la tarea de background-geolocation se detendrá si la aplicación se cierra o pasa a segundo plano. Recordemos que el plugin funciona en modo background y foreground.
    };

      if (this.platform.is('ios')) {
        config.locationProvider = 0;
        config.pauseLocationUpdates = true;
      }

      if (this.platform.is('android')) {
        config.locationProvider = 1; // Técnica usada para detectar los cambios de posición.
        config.startForeground = true; // Habilita la detección de cambio de posición cuando la app está en segundo plano.
        config.interval = 2000; // Será el mínimo de tiempo que el plugin estará solicitando la posición al dispositivo. Debemos tener en cuanta que los valores de tiempo van condicionados con los de distancia. Es decir si el dispositivo no detecta el movimiento x metros en x tiempo no solicitá la posición.
        config.fastestInterval = 5000;
        config.activitiesInterval = 10000;
      }

      console.log(config);
    
     this.backgroundGeolocation.configure(config).subscribe((location) => {
    
       console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);
    
       // Run update inside of Angular's zone
       this.zone.run(() => {
         this.lat = location.latitude;
         this.lng = location.longitude;
         this.logs.push(`${location.latitude},${location.longitude}`);
       });

       // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      if (this.platform.is('ios')) {
        this.backgroundGeolocation.finish(); // FOR IOS ONLY
      }
    
     }, (err) => {
    
       console.log(err);
    
     });
    
      // Turn ON the background-geolocation system.
      this.backgroundGeolocation.start();
    
    
      // Foreground Tracking
    
      let options = {
        frequency: 3000,
        enableHighAccuracy: true
      };
    
      this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
      
        console.log(position);
      
        // Run update inside of Angular's zone
        this.zone.run(() => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          this.logs.push(`${position.coords.latitude},${position.coords.longitude}`);
        });
      
      });
  }

  // Comprueba si la detección de posición está habilitada en el dispositivo. En caso contrario lanza la opción nativa para habilitarla.
  startTracking() {
    this.platform.ready().then((readySource) => {
      console.log('Platform ready from', readySource);
      // Platform now ready, execute any required native code.
      if (readySource == "cordova") {
        this.backgroundGeolocation.isLocationEnabled()
        .then((rta) =>{
          if(rta){
            this.startBackgroundGeolocation();
          } else {
            this.backgroundGeolocation.showLocationSettings();
          }
        })
      }
      else if (readySource == "dom") {
        this.presentAlert();
      }
    });
  }
    
  stopTracking() {
    console.log('stopTracking');
    
    this.platform.ready().then((readySource) => {
      console.log('Platform ready from', readySource);
      // Platform now ready, execute any required native code.
      if (readySource == "cordova") {
        this.backgroundGeolocation.stop();
      }
      else if (readySource == "dom") {
          this.presentAlert();
      }
    });
     if (typeof this.watch != "undefined") this.watch.unsubscribe();
  }

  presentAlert() {
    let alert = this.alertCtrl.create({
      title: 'Error Cordova',
      subTitle: 'To test the application use a mobile device.',
      buttons: ['OK']
    });
    alert.present();
  }
}
