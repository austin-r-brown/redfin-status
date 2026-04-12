import { ListingStatus } from './enums';

export type Time = [number, number?, number?];

export type EmailConfig = {
  sender: { email: string };
  to: { email: string }[];
  subject?: string;
  htmlContent?: string;
  apiKey: string;
};

export type BackupFile = {
  path: string;
  createdAt: Date;
};

export type ListingInfo = {
  status: ListingStatus;
  address: string;
};

export type AxiosData = {
  status: number;
  statusText: string;
  headers: Headers;
  config: object;
  request: object;
  data: string;
};

export type RedfinData = {
  addressSectionInfo: {
    status: {
      displayValue: string;
      definition: string;
      longerDefinitionToken: string;
    };
    priceInfo: { amount: number; label: string; displayLevel: number };
    latestPriceInfo: { amount: number; label: string; displayLevel: number };
    sqFt: { displayLevel: number; value: number };
    pricePerSqFt: number;
    streetAddress: {
      streetNumber: string;
      directionalPrefix: string;
      streetName: string;
      streetType: string;
      directionalSuffix: string;
      unitType: string;
      unitValue: string;
      addressDisplayLevel: object;
      assembledAddress: string;
      includeStreetNumber: true;
      includeUnitNumber: true;
      includeStreetName: true;
    };
    latLong: { latitude: number; longitude: number };
    beds: number;
    baths: number;
    yearBuilt: number;
    city: string;
    state: string;
    zip: string;
    countryCode: string;
    soldDate: number;
    soldDateTimeZone: string;
    lotSize: number;
    fips: string;
    apn: string;
    hasOpen: false;
    hasAgc: false;
    isRedfin: false;
    isHot: false;
    avmInfo: { displayLevel: number; propertyId: number; predictedValue: number };
    searchStatus: number;
    propertyType: number;
    listingType: number;
    isMappable: true;
    userCanShare: true;
    riftDataSource: string;
    homeStatusLabel: string;
    numFullBaths: number;
    staticMapUrl: string;
    url: string;
    primaryPhotoUrl: string;
    rawQuarterBaths: number;
    rawHalfBaths: number;
    rawThreeQuarterBaths: number;
    rawFullBaths: number;
  };
  mediaBrowserInfo: {
    photos: [];
    scans: [];
    sashes: [];
    videos: [];
    isHot: false;
    streetView: {
      latLong: object;
      streetViewUrl: string;
      displayLevel: number;
      dataSourceId: number;
      staticMapUrl: string;
      streetViewAvailable: true;
    };
    altTextForImage: string;
    dataSourceId: number;
    assembledAddress: string;
    previousListingPhotosCount: number;
    displayType: number;
  };
};
