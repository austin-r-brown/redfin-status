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
  openHouseDate?: string;
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
      includeStreetNumber: boolean;
      includeUnitNumber: boolean;
      includeStreetName: boolean;
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
    hasOpen: boolean;
    hasAgc: boolean;
    isRedfin: boolean;
    isHot: boolean;
    avmInfo: { displayLevel: number; propertyId: number; predictedValue: number };
    searchStatus: number;
    propertyType: number;
    listingType: number;
    isMappable: boolean;
    userCanShare: boolean;
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
    photos: {
      photoUrls: object;
      thumbnailData: object;
      displayLevel: number;
      dataSourceId: number;
      photoType: string;
      subdirectory: string;
      fileName: string;
      height: number;
      width: number;
      previewIndex: number;
      photoId: number;
    }[];
    scans: {
      scanId: number;
      scanUrl: string;
      scanHost: number;
      displayLevel: number;
      isAgentUploaded: boolean;
    }[];
    sashes: {
      sashType: number;
      sashTypeId: number;
      sashTypeName: string; // For Sale
      sashTypeColor: string;
      isRedfin: boolean;
      isActiveKeyListing: boolean;
      openHouseText: string;
      lastSaleDate: string;
      lastSalePrice: string;
    }[];
    videos: [];
    isHot: boolean;
    streetView: {
      latLong: { latitude: number; longitude: number };
      streetViewUrl: string;
      displayLevel: number;
      dataSourceId: number;
      staticMapUrl: string;
      streetViewAvailable: boolean;
    };
    altTextForImage: string;
    dataSourceId: number;
    assembledAddress: string;
    previousListingPhotosCount: number;
    displayType: number;
  };
};
